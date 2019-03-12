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

    def threadlocked_transform_realtime_delta(delta, version)
      RedisClassy.redis = Cache.client
      lock_name = "rt_text_id_#{id}"
      puts "<SEMAPHORE>>>> locked? #{RedisMutex.new(lock_name).locked?}"
      RedisMutex.with_lock(lock_name, block: 0) do
        transform_realtime_delta(delta, version)
      end
    rescue RedisMutex::LockError
      false
    end

    def transform_realtime_delta(delta, version)
      rt_data = realtime_data_content
      rt_data.data = QuillSchmoozer.compose(rt_data.data, delta)
      rt_data.version += 1

      update_realtime_data_content(rt_data)

      puts "#{version} VVVVVVVV version: #{rt_data.version}"
      puts rt_data.data.to_json
      puts "^^^^^^^^\n\n"

      {
        delta: delta,
        data: rt_data.data,
        version: rt_data.version,
      }
    end

    def __transform_realtime_delta(delta, version)
      rt_data = realtime_data_content
      v = version.to_i
      transformed_delta = delta
      if (v - realtime_data_version).abs > 10
        # just return unchanged??
        return {
          delta: transformed_delta,
          version: rt_data.version,
        }
      end
      rt_data.deltas.drop(v).each_with_index do |concurrent_delta, i|
        puts "~~~~~~~~~~~ #{i} conc...."
        puts concurrent_delta
        puts 'before...'
        puts transformed_delta
        transformed_delta = QuillSchmoozer.transform(concurrent_delta, transformed_delta)
        puts 'after...'
        puts transformed_delta
        puts '~~~~!~~~~'
      end
      rt_data.data = QuillSchmoozer.compose(rt_data.data, transformed_delta)

      rt_data.deltas << transformed_delta
      rt_data.version = rt_data.deltas.count
      update_realtime_data_content(rt_data)

      puts "#{version} VVVVVVVV version: #{rt_data.version}"
      puts rt_data.data.to_json
      puts "^^^^^^^^\n\n"

      {
        delta: transformed_delta,
        data: rt_data.data,
        version: rt_data.version,
      }
    end

    def realtime_data_content
      data = Cache.get(realtime_data_key) || { data: nil, deltas: [], version: 0 }
      Mashie.new(data)
    end

    def realtime_data_version
      realtime_data_content.deltas.count
    end

    def update_realtime_data_content(data)
      Cache.set(realtime_data_key, data)
    end

    def delete_realtime_data_content
      Cache.delete(realtime_data_key)
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
