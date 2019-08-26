class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :order, :width, :height, :parent_id, :pinned,
             :image_contain, :card_question_type, :is_cover, :filter, :hidden,
             :show_replace, :updated_at, :col, :row, :num_votes, :user_has_voted

  attribute :link do
    @object.is_a? CollectionCard::Link
  end

  attribute :pinned_and_locked do
    @object.pinned_and_locked?
  end

  attribute :can_edit_parent do
    @current_ability ? @current_ability.can?(:edit_content, (@parent || @object.try(:parent))) : false
  end

  attribute :is_master_template_card do
    @object.master_template_card?
  end

  attribute :user_has_voted do
    @object.user_has_voted?(@current_user)
  end

  belongs_to :item
  belongs_to :collection
  belongs_to :parent do
    data do
      @parent || @object.parent
    end
  end
  belongs_to :record
  belongs_to :templated_from
end
