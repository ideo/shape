class CollectionCover < SimpleService
  def initialize(collection)
    @collection = collection
    @inheritance = Roles::Inheritance.new(collection)
  end

  def self.cover_text(collection, text_item)
    new(collection).cover_text(text_item)
  end

  def call
    media = cover_media_item
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

  def cover_media_item
    manual_cover = manually_set_cover
    return manual_cover if @collection.try(:cached_cover).try(:no_cover) == true
    if manual_cover.empty?
      new_cover = first_media_item
      new_cover.update_column(:is_cover, true)
      return new_cover
    end
    manual_cover
  end

  private

  def media_item(card)
    {
      card_id: card.id,
      card_order: card.order,
      item_id: card.item.id,
      content: card.item.type == 'Item::TextItem' ? cover_text(card.item) : card.item.image_url,
    }
  end

  def first_shareable_item(type:)
    first_item = nil
    @collection.items_and_linked_items.where(type: type).each do |item|
      next if @inheritance.private_child?(item)
      first_item = item
      break
    end
    return {} unless first_item
    card = CollectionCard.find_by(item_id: first_item.id)
    media_item(card)
  end

  def first_media_item
    first_shareable_item(type: ['Item::FileItem', 'Item::VideoItem'])
  end

  def first_text_item
    first_shareable_item(type: 'Item::TextItem')
  end

  def manually_set_cover
    card = @collection.collection_cards.where(is_cover: true).first
    return if card.nil?
    media_item(card)
  end
end
