class CollectionBuilder
  attr_reader :collection, :errors

  def initialize(params:, organization: nil, parent_card: nil)
    @collection = Collection.new(params)
    @organization = organization
    @parent_card = parent_card
    @errors = []
  end

  def save
    return false unless assign_attributes
    save_collection
  end

  private

  attr_reader :organization, :parent_card

  def assign_attributes
    if parent_card? && parent_card.reference? && organization?
      errors << 'Can only assign organization or as sub-collection, not both'
      return false
    end

    collection.parent_collection_card = parent_card if parent_card?
    collection.organization = organization if organization?

    true
  end

  def save_collection
    if collection.save
      return true unless parent_card?

      unless parent_card.update_attributes(collection: collection)
        errors << parent_card.errors.full_messages
      end
    else
      errors << collection.errors.full_messages
    end

    errors.blank?
  end

  def organization?
    organization.present?
  end

  def parent_card?
    parent_card.present?
  end
end
