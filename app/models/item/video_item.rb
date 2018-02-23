class Item
  class VideoItem < Item
    validates :url, presence: true

    def video_type
      if Video::Youtube.valid_url?(url)
        'Youtube'
      elsif Video::Vimeo.valid_url?(url)
        'Vimeo'
      end
    end
  end
end
