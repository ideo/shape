class Item
  class LinkItem < Item
    validates :url, presence: true
  end
end
