class Item
  class VideoItem < Item
    # name gets passed in from Youtube/Vimeo so we want to truncate it before create
    before_create :truncate_name
    validates :url, presence: true
    validates :thumbnail_url, presence: true

    def image_url
      thumbnail_url
    end
  end
end
