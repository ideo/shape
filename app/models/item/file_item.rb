class Item
  class FileItem < Item
    has_filestack_file_options required: true

    def image_url
      filestack_file_url
    end

    # TODO: may get rid of this since we're returning the related filestack record?
    def cache_attributes
      if cached_filestack_file_url != filestack_file_url
        self.cached_filestack_file_url = filestack_file_url
      end
      super
    end

    def requires_roles?
      return false if parent.test_collection?
      true
    end

    def mime_base_type
      filestack_file && filestack_file.mimetype.split('/').first
    end

    def image?
      filestack_file && mime_base_type == 'image'
    end

    private

    # on_create callback
    def generate_name
      self.name = filestack_file.filename_without_extension
      truncate_name
    end
  end
end
