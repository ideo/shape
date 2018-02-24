class Item
  class TextItem < Item
    before_create :add_name, unless: :name?
    validates :content, presence: true
    validates :text_data, presence: true

    private

    def add_name
      # create a name based on the first <25 characters, splitting on words.
      # primarily used for breadcrumb trail (perhaps eventually slugs?)
      self.name = content.truncate(25, separator: /\s/, omission: '')
    end
  end
end
