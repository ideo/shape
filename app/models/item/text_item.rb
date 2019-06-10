# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
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
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#  index_items_on_type                                 (type)
#

class Item
  class TextItem < Item
    before_validation :import_html_content_if_blank, on: :create
    before_validation :rename_if_name_was_default, on: :update
    has_one :question_answer, inverse_of: :open_response_item

    def import_plaintext_content(text)
      self.data_content = QuillContentConverter.new(text).text_to_quill_ops
    end

    def import_html_content(html)
      self.data_content = QuillContentConverter.new(html).html_to_quill_ops
    end

    # build up a plaintext string of all the text content, with elements separated by pipes "|"
    # e.g. "Mission Statement | How might we do x..."
    def plain_content(only_first_line: false, splitter: ' | ')
      return '' unless data_content.present? && data_content['ops'].present?
      text = ''
      data_content['ops'].each_with_index do |data, i|
        # strip out escaped strings e.g. "&lt;strong&gt;" if someone typed raw HTML
        # strip out extra whitespaces/newlines
        t = StripTags.new(data['insert']).call
        # sometimes the data['insert'] is just a newline, ignore
        next if t.empty?
        return t if only_first_line
        text += splitter if i.positive?
        text += t
      end
      CGI.unescapeHTML(text)
    end

    def threadlocked_transform_realtime_delta(user, data)
      RedisClassy.redis = Cache.client
      lock_name = "rt_text_id_#{id}"
      RedisMutex.with_lock(lock_name, block: 0) do
        transform_realtime_delta(
          user,
          delta: data.delta,
          version: data.version,
          full_content: data.full_content,
        )
      end
    rescue RedisMutex::LockError
      # error needs to alert the frontend to the latest version
      { error: 'locked', version: data_content['version'].to_i }
    end

    def transform_realtime_delta(user, delta:, version:, full_content:)
      saved_version = data_content['version'].to_i

      if version.to_i < saved_version
        # error needs to alert the frontend to the latest version
        return { error: 'locked', version: saved_version }
      end
      new_version = saved_version + 1
      full_content['version'] = new_version
      full_content['last_10'] = data_content['last_10'] || []
      full_content['last_10'] << { delta: delta, version: new_version, editor_id: user.id.to_s }
      full_content['last_10'] = full_content['last_10'].last(10)
      # NOTE: is a "full update" too heavy here for performance, or ok?
      # it basically means it's calling a few related updates on the parent / cards
      # update_column(:data_content, full_content)
      update(data_content: full_content)
      {
        delta: delta.as_json,
        version: full_content['version'],
        last_10: full_content['last_10'].as_json,
      }
    end

    private

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
  end
end
