class Item
  class VideoItem < Item
    validates :url, presence: true
    validates :thumbnail_url, presence: true

    def image_url
      thumbnail_url
    end
  end
end
