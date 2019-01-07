class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :order, :width, :height, :parent_id, :type, :pinned,
             :image_contain, :card_question_type, :is_cover, :filter, :hidden

  attribute :pinned_and_locked do
    @object.pinned_and_locked?
  end
  attribute :link do
    @object.is_a? CollectionCard::Link
  end
  attribute :can_move do
    @current_ability ? @current_ability.can?(:edit_content, @object.try(:parent)) : false
  end

  belongs_to :item
  belongs_to :collection
  belongs_to :parent
  belongs_to :record
  belongs_to :templated_from
end
