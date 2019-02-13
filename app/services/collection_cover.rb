class CollectionCover < SimpleService
  def initialize(collection)
    @collection = collection
    if collection.cached_cover.blank?
      # if this collection has no setting for no_cover, default to false
      @no_cover = false
    else
      @no_cover = collection.cached_cover['no_cover'] || false
    end
    @inheritance = Roles::Inheritance.new(collection)
  end

  def self.cover_text(collection, text_item)
    new(collection).cover_text(text_item)
  end

  def call
    media = media_item(cover_media_item_card)
    text = media_item(first_text_item_card)
    {
      # NOTE: image_url should only be used on the frontend for video items, e.g. a youtube image url
      image_url: media[:content],
      # image items use handle so that they can generate a secure filestack URL
      image_handle: media[:handle],
      text: text[:content],
      # these next attributes are just for knowing when to re-generate
      card_ids: [text[:card_id], media[:card_id]].compact,
      card_order: [text[:card_order], media[:card_order]].compact.max,
      item_id_text: text[:item_id],
      item_id_media: media[:item_id],
      no_cover: @no_cover,
    }.as_json
  end

  def cover_text(text_item)
    text_item.plain_content.truncate(500, separator: /\s/, omission: '')
  end

  def cover_media_item_card
    return nil if @no_cover
    cover_card = find_manually_set_cover
    return cover_card if cover_card.present?

    # this is the case where the system looks for the first/best image for the cover
    cover_card = first_media_item_card
    return nil unless cover_card.present?
    cover_card.update(is_cover: true)
    CollectionUpdateBroadcaster.call(@collection)
    cover_card
  end

  private

  def media_item(card)
    return {} if card.blank?
    {
      card_id: card.id,
      card_order: card.order,
      item_id: card.item.id,
      content: card.item.type == 'Item::TextItem' ? cover_text(card.item) : card.item.image_url,
      # this will just return nil e.g. for text items
      handle: card.item.filestack_file_handle,
    }
  end

  def first_shareable_item_card(type:)
    first_item = nil
    # items_and_linked_items will get collection_cards in order
    @collection.items_and_linked_items.where(type: type).each do |item|
      # for FileItems we find, skip over any non-images
      next if item.is_a?(Item::FileItem) && !item.image?
      next if @inheritance.private_child?(item)
      first_item = item
      break
    end
    first_item ? @collection.collection_cards.find_by(item_id: first_item.id) : nil
  end

  def first_media_item_card
    first_shareable_item_card(type: ['Item::FileItem', 'Item::VideoItem'])
  end

  def first_text_item_card
    first_shareable_item_card(type: 'Item::TextItem')
  end

  def find_manually_set_cover
    @collection.collection_cards.find_by(is_cover: true)
  end
end
