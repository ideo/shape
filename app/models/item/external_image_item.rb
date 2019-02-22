class Item
  class ExternalImageItem < Item
    validates :url, presence: true

    def image_url
      url
    end
  end
end
