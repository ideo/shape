class Item
  class VideoItem < Item
    validates :url, presence: true
    validates :thumbnail_url, presence: true
  end
end
