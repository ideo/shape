module ColabImport
  class CreateMediaItem
    attr_reader :item

    def initialize(data:)
      @data = data
      @item = nil
    end

    # Creates a new item for a given collection card
    def call
      if type == 'image'
        create_image_item
      elsif type == 'video'
        create_video_item
      else
        raise "Unsupported CreateMediaItem item type: #{type}"
      end
    end

    def errors
      @item.errors
    end

    private

    def create_image_item
      @item = Item::ImageItem.create(
        name: name,
        filestack_file: FilestackFile.first, # FilestackFile.create_from_url(url)
      )
    end

    def create_video_item
      # No video items from media had a thumbnail
      # some were youtube, some on drive
      @item = Item::VideoItem.create(
        name: name,
        url: url,
        thumbnail_url: url,
      )
    end

    # All 'types' seemed to be image or video
    def type
      @data['type']
    end

    def url
      @data['source']
    end

    def name
      @data['desc']
    end
  end
end
