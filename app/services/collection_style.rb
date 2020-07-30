class CollectionStyle < SimpleService
  def initialize(collection)
    @collection = collection
  end

  def call
    {
      background_image_url: background_image_url,
      font_color: font_color,
    }
  end

  private

  def background_image_url
    return @collection.background_image_url if @collection.background_image_url.present?

    @collection
      .parents
      .where(propagate_background_image: true)
      .where("cached_attributes->>'background_image_url' IS NOT NULL")
      .pluck(:cached_attributes)
      .last
      .try(:[], 'background_image_url')
  end

  def font_color
    return @collection.font_color if @collection.font_color.present?

    @collection
      .parents
      .where(propagate_font_color: true)
      .where('font_color IS NOT NULL')
      .pluck(:font_color)
      .last
  end
end
