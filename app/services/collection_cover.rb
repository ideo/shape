class CollectionCover
  attr_reader :data

  def initialize(collection)
    @collection = collection
    @inheritance = Roles::Inheritance.new(collection)
  end

  def generate
    @data = {
      image_url: first_media_item,
      name: @collection.name,
      text: first_text_item,
    }
  end

  private

  def first_shareable_item(type:)
    first_item = nil
    @collection.items_and_linked_items.where(type: type).each do |item|
      next if @inheritance.private_child?(item)
      first_item = item
      break
    end
    first_item
  end

  def first_media_item
    item = first_shareable_item(type: ['Item::ImageItem', 'Item::VideoItem'])
    return item.image_url if item
  end

  def first_text_item
    item = first_shareable_item(type: 'Item::TextItem')
    return item.plain_content if item
  end
end
