class CollectionBuilder
  attr_reader :collection, :errors

  def initialize(params:, organization: nil, collection_card: nil)
    @collection = Collection.new(params)
    @organization = organization
    @collection_card = collection_card
    @errors = []
  end

  def save
    return false unless assign_attributes
    save_collection
  end

  private

  attr_reader :organization, :collection_card

  def assign_attributes
    if collection_card? && organization?
      errors << 'Can only assign organization or as sub-collection, not both'
      return false
    end

    if collection_card?
      collection.primary_collection_card = collection_card
    elsif organization?
      collection.organization = organization
    end

    true
  end

  def save_collection
    if collection.save
      return true unless collection_card?

      unless collection_card.update_attributes(collection: collection)
        errors << collection_card.errors.full_messages
      end
    else
      errors << collection.errors.full_messages
    end

    errors.blank?
  end

  def organization?
    organization.present?
  end

  def collection_card?
    collection_card.present?
  end
end
