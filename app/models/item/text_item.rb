class Item
  class TextItem < Item
    validates :content, presence: true
  end
end
