# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  background_color           :string
#  background_color_opacity   :float            default(1.0)
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  last_broadcast_at          :datetime
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  style                      :jsonb
#  thumbnail_url              :string
#  type                       :string
#  unarchived_at              :datetime
#  url                        :string
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  data_source_id             :bigint(8)
#  filestack_file_id          :integer
#  legend_item_id             :integer
#  roles_anchor_collection_id :bigint(8)
#
# Indexes
#
#  index_items_on_archive_batch                        (archive_batch)
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_question_type                        (question_type)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#

class Item
  class TextItem < Item
    before_validation :import_html_content_if_blank, on: :create
    before_validation :rename_if_name_was_default, on: :update
    has_one :question_answer, inverse_of: :open_response_item

    before_save :scrub_data_attrs
    before_save :perform_realtime_update, if: :quill_data_changed?
    before_create :set_default_version

    attr_accessor :quill_data_was

    def import_plaintext_content(text)
      self.data_content = QuillContentConverter.new(text).text_to_quill_ops
    end

    def import_html_content(html)
      self.data_content = QuillContentConverter.new(html).html_to_quill_ops
    end

    # build up a plaintext string of all the text content, with elements separated by pipes "|"
    # e.g. "Mission Statement | How might we do x..."
    def plain_content(only_first_line: false, splitter: ' | ', data_content: self.data_content)
      ops = HashWithIndifferentAccess.new(data_content).try(:[], :ops)
      return '' unless ops.present?

      text = ''
      ops.each do |data|
        # strip out escaped strings e.g. "&lt;strong&gt;" if someone typed raw HTML
        # strip out extra whitespaces/newlines
        t = StripTags.new(data[:insert]).call
        return t if only_first_line

        text += t
      end
      text = text.strip.gsub(/\n+/, splitter).gsub(/\s+/, ' ')
      CGI.unescapeHTML(text)
    end

    def plain_content_was
      plain_content(data_content: data_content_was)
    end

    def plain_content_changed?
      plain_content_was != plain_content
    end

    def save_and_broadcast_quill_data(user, data)
      # update delta with transformed one
      new_data = threadlocked_transform_realtime_delta(user, Mashie.new(data))
      # broadcast to fellow text channel viewers; new_data may include an error message
      received_changes(new_data, user)

      # only continue if we haven't broadcasted to the collection in the last 4 seconds
      return if last_broadcast_at.present? && (Time.current - last_broadcast_at) < 4

      update_columns(last_broadcast_at: Time.current)
      # only continue if anyone else is still viewing the text item's collection
      return if parent&.num_viewers&.zero?

      CollectionUpdateBroadcaster.new(parent, user).text_item_updated(self)
      # push one more broadcast to get any last updates e.g. that happened < 4 seconds
      # and to call LinkBroadcastWorker
      TextItemBroadcastWorker.perform_in(
        5.seconds,
        id,
        user&.id,
      )
    end

    def save_and_broadcast_background(user, data)
      self.background_color = data.background_color
      self.background_color_opacity = data.background_color_opacity
      save

      received_changes(data, user)
    end

    def threadlocked_transform_realtime_delta(user, data)
      RedisClassy.redis = Cache.client
      lock_name = "rt_text_id_#{id}"
      RedisMutex.with_lock(lock_name, block: 0) do
        transform_realtime_delta(
          user: user,
          delta: data.delta,
          version: data.version,
          full_content: data.full_content,
        )
      end
    rescue RedisMutex::LockError
      # error needs to alert the frontend to the latest version
      {
        error: 'locked',
        version: version.to_i,
        last_10: last_10,
      }
    end

    def transform_realtime_delta(user: nil, delta:, version:, full_content:)
      saved_version = self.version.to_i

      if version.to_i < saved_version
        # error needs to alert the frontend to the latest version
        return {
          error: 'locked',
          version: saved_version,
          last_10: last_10,
        }
      end

      new_version = saved_version + 1
      full_content['version'] = new_version
      full_content['last_10'] = data_content['last_10'] || []
      full_content['last_10'] << {
        delta: delta,
        version: new_version,
        editor_id: user ? user.id.to_s : 'api',
      }
      full_content['last_10'] = full_content['last_10'].last(10)
      # -- this is the only place a text_item's data_content should get directly updated
      # NOTE: intentionally NOT doing a full update otherwise callbacks would get called again!
      update_columns(data_content: full_content, updated_at: Time.current)
      # perform the "touch" without doing another full lifecycle update
      touch_related_cards
      {
        delta: delta.as_json,
        version: full_content['version'],
        last_10: full_content['last_10'].as_json,
      }
    end

    def quill_data
      { ops: ops }.as_json
    end

    def quill_data=(new_data = {})
      # like AM::Dirty, store previous to later know if `quill_data_changed?`
      self.quill_data_was = Mashie.new(ops: data_content_in_database['ops'])
      # set the new ops
      self.ops = Mashie.new(new_data).ops
    end

    def quill_data_changed?
      return false unless quill_data_was.present?

      quill_data_was.to_json != quill_data.to_json
    end

    def perform_realtime_update
      # determine the Quill diff that we just applied
      # NOTE: Schmooze::JavaScript::Error can happen here which probably means badly formatted data;
      # we don't rescue so that AppSignal can flag these
      delta = QuillSchmoozer.diff(quill_data_was, quill_data)
      data = Mashie.new(
        delta: delta,
        version: version,
        full_content: quill_data,
      )
      save_and_broadcast_quill_data(nil, data)
    end

    private

    def scrub_data_attrs
      return unless ops.present?

      new_ops = ops.map do |op|
        attrs = op['attributes']
        attrs.delete('undefined') if attrs && attrs['undefined'].present?
        op
      end
      self.ops = new_ops
    end

    # on_create callback
    def generate_name
      # create a name based on the first 40 characters, splitting on words.
      # primarily used for breadcrumb trail (perhaps eventually slugs?)
      if plain_content.blank?
        self.name = 'Text'
      else
        self.name = plain_content.split(' | ').first
      end
      truncate_name
    end

    def import_html_content_if_blank
      return if data_content.present?

      import_html_content(content)
    end

    def rename_if_name_was_default
      return unless name == 'Text'

      generate_name
    end

    def set_default_version
      self.version ||= 1
    end
  end
end
