class Item
  class FileItem < Item
    has_filestack_file_options required: true

    def cache_attributes
      if self.cached_filestack_file_url != self.filestack_file_url
        self.cached_filestack_file_url = self.filestack_file_url
      end
      super
    end

    private

    # on_create callback
    def generate_name
      self.name = filestack_file.filename_without_extension
      truncate_name
    end
  end
end
