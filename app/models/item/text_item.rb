class Item
  class TextItem < Item
    before_create :add_name, unless: :name?
    validates :content, presence: true
    validates :text_data, presence: true

    private

    def add_name
      # create a name based on the first <25 characters, splitting on words.
      # primarily used for breadcrumb trail (perhaps eventually slugs?)
      plain_content = Rails::Html::FullSanitizer.new.sanitize(content)
      # strip out escaped strings e.g. "&lt;strong&gt;" if someone typed raw HTML
      plain_content.gsub!(/&lt;[^&]*&gt;/, '')
      self.name = plain_content.truncate(25, separator: /\s/, omission: '')
    end
  end
end
