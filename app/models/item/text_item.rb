class Item
  class TextItem < Item
    before_create :add_name, unless: :name?
    validates :content, presence: true

    private

    def add_name
      self.name = content.truncate(25, separator: /\s/, omission: '')
    end
  end
end
