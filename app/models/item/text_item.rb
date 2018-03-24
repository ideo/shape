class Item
  class TextItem < Item
    validates :content, presence: true
    validates :text_data, presence: true

    def plain_content
      # strip HTML tags
      # also add pipes between tags that are touching
      # e.g. <h1>Title</h1><p>More text</p> => Title | More text
      text = Rails::Html::FullSanitizer.new.sanitize(content.gsub('><', '>|<'))
      # strip out escaped strings e.g. "&lt;strong&gt;" if someone typed raw HTML
      text.gsub(/&lt;[^&]*&gt;/, '')
          .gsub(/^[|]+/, '') # remove any pipes at the beginning
          .gsub(/[|]+$/, '') # remove any pipes at the end
          .gsub(/[|]+/, ' | ') # add spaces between pipes
          .squeeze(' ') # compress multiple whitespaces into one space
          .strip
    end

    private

    # on_create callback
    def generate_name
      # create a name based on the first 40 characters, splitting on words.
      # primarily used for breadcrumb trail (perhaps eventually slugs?)
      self.name = plain_content
      truncate_name
    end
  end
end
