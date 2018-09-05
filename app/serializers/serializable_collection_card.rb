class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :id, :order, :width, :height, :parent_id, :type, :pinned, :image_contain
  attribute :pinned_and_locked do
    # rename attr to be without the "?"
    @object.pinned_and_locked?
  end
  attribute :link do
    @object.is_a? CollectionCard::Link
  end
  attribute :can_move do
    @current_ability.can?(:edit_content, @object.try(:parent))
  end

  belongs_to :item
  belongs_to :collection
  belongs_to :parent
  belongs_to :record
  belongs_to :templated_from
end
