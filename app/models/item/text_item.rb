class Item
  class TextItem < Item
    validates :content, presence: true
    validates :text_data, presence: true
    has_one :question_answer, inverse_of: :open_response_item

    def set_ops_from_plain_text(text)
      text_data['ops'] = TextToQuillOps.call(text)
      self.content = text
    end

    # build up a plaintext string of all the text content, with elements separated by pipes "|"
    # e.g. "Mission Statement | How might we do x..."
    def plain_content(only_first_line: false)
      return '' unless text_data.present? && text_data['ops'].present?
      text = ''
      text_data['ops'].each_with_index do |data, i|
        # strip out escaped strings e.g. "&lt;strong&gt;" if someone typed raw HTML
        # strip out extra whitespaces/newlines
        t = StripTags.new(data['insert']).call
        # sometimes the data['insert'] is just a newline, ignore
        next if t.empty?
        return t if only_first_line
        text += ' | ' if i.positive?
        text += t
      end
      text
    end

    private

    # on_create callback
    def generate_name
      # create a name based on the first 40 characters, splitting on words.
      # primarily used for breadcrumb trail (perhaps eventually slugs?)
      self.name = plain_content.split(' | ').first
      truncate_name
    end
  end
end
