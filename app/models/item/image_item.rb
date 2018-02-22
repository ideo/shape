class Item
  class ImageItem < Item
    validates :filestack_file, presence: true

    def name
      return read_attribute(:name) if read_attribute(:name).present?

      filestack_file.filename_without_extension
    end
  end
end
