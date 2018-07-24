class CollectionCover < SimpleService
  def initialize(collection)
    @collection = collection
    @inheritance = Roles::Inheritance.new(collection)
  end

  def self.cover_text(collection, text_item)
    new(collection).cover_text(text_item)
  end

  def call
    media = first_media_item
    text = first_text_item
    {
      image_url: media[:content],
      text: text[:content],
      # these next attributes are just for knowing when to re-generate
      card_ids: [text[:card_id], media[:card_id]].compact,
      card_order: [text[:card_order], media[:card_order]].compact.max,
      item_id_text: text[:item_id],
      item_id_media: media[:item_id],
    }.as_json
  end

  def cover_text(text_item)
    text_item.plain_content.truncate(500, separator: /\s/, omission: '')
  end

  private

  def first_shareable_item(type:)
    first_item = nil
    @collection.items_and_linked_items.where(type: type).each do |item|
      next if @inheritance.private_child?(item)
      first_item = item
      break
    end
    return {} unless first_item
    card = CollectionCard.find_by(item_id: first_item.id)
    {
      card_id: card.id,
      card_order: card.order,
      item_id: first_item.id,
      content: type == 'Item::TextItem' ? cover_text(first_item) : first_item.image_url,
    }
  end

  def first_media_item
    first_shareable_item(type: ['Item::FileItem', 'Item::VideoItem'])
  end

  def first_text_item
    first_shareable_item(type: 'Item::TextItem')
  end
end
