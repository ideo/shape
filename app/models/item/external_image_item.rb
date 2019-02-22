class Item
  class ExternalImageItem < Item
    validates :url, presence: true

    def image_url
      thumbnail_url
    end
  end
end
