class CollectionBuilder
  attr_reader :collection, :errors

  def initialize(params:, organization: nil, parent_card: nil)
    @collection = Collection.new(params)
    @errors = @collection.errors
    @organization = organization
    @parent_card = parent_card
  end

  def save
    return false unless assign_attributes
    save_collection
  end

  private

  attr_reader :organization, :parent_card

  def assign_attributes
    if parent_card? && parent_card.link? && organization?
      @collection.errors.add(:base, 'Can only assign organization or as sub-collection, not both')
      return false
    end

    @collection.parent_collection_card = parent_card if parent_card?
    @collection.organization = organization if organization?

    true
  end

  def save_collection
    result = @collection.save
    if result
      return true unless parent_card?

      unless parent_card.update_attributes(collection: @collection)
        parent_card.errors.each do |field, message|
          @collection.errors.add(field, message)
        end
      end
    end
    result
  end

  def organization?
    organization.present?
  end

  def parent_card?
    parent_card.present?
  end
end
