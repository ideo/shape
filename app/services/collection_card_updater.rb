class CollectionCardUpdater < SimpleService
  def initialize(collection_card, attributes)
    @collection_card = collection_card
    @attributes = attributes
  end

  def call
    assign_attributes
    update_cached_cover
    @collection_card.save
  end

  def assign_attributes
    @collection_card.attributes = @attributes.except(:hardcoded_title, :hardcoded_subtitle, :subtitle_hidden)
    @collection_card.updated_at = Time.now
  end

  def update_cached_cover
    cover_hash = {}
    if @attributes[:cover_card_id].present?
      cover_card = CollectionCard.find(@attributes[:cover_card_id])

      return unless cover_card&.item&.is_a? Item::FileItem

      cover_hash[:image_url] = cover_card.item.image_url
      cover_hash[:image_handle] = cover_card.item.filestack_file_handle
    end

    cover_attrs = @attributes.slice(:hardcoded_title, :hardcoded_subtitle, :subtitle_hidden).to_h.symbolize_keys

    if cover_attrs.present?
      cover_attrs.each do |k, v|
        cover_hash[k] = v
      end
    end

    @collection_card.cached_cover = cover_hash
  end
end
