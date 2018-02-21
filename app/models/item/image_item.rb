class Item
  class ImageItem < Item
    validates :filestack_file, presence: true
  end
end
