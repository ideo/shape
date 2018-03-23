class Item
  class ImageItem < Item
    has_filestack_file_options required: true

    def image_url
      filestack_file_url
    end
  end
end
