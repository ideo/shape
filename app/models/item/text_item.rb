class Item
  class TextItem < Item
    validates :content, presence: true
    validates :data_content, presence: true
    before_validation :import_html_content_if_blank, on: :create
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
      text
    end

    def threadlocked_transform_realtime_delta(data)
      RedisClassy.redis = Cache.client
      lock_name = "rt_text_id_#{id}"
      RedisMutex.with_lock(lock_name, block: 0) do
        transform_realtime_delta(
          delta: data.delta,
          version: data.version,
          full_content: data.full_content,
        )
      end
    rescue RedisMutex::LockError
      false
    end

    def transform_realtime_delta(delta:, version:, full_content:)
      saved_version = data_content['version'].to_i

      return false if version.to_i < saved_version
      full_content['version'] = saved_version + 1
      update_column(:data_content, full_content)
      parent.try(:touch)
      {
        delta: delta,
        version: full_content['version'],
      }
    end

    private

    def realtime_data_key
      "#{self.class.base_class.name}_#{id}_realtime"
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
  end
end
