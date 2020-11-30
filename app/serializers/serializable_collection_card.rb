class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'

  id do
    @object.id ? @object.id_with_idea_id : "result-#{@object.record.id}"
  end

  attributes(
    :order,
    :width,
    :height,
    :parent_id,
    :pinned,
    :image_contain,
    :card_question_type,
    :is_cover,
    :filter,
    :hidden,
    :show_replace,
    :updated_at,
    :col,
    :row,
    :section_type,
    :section_name,
    :font_color,
    :font_background,
    :cover_card_id,
  )

  stringified_attributes(
    :idea_id,
  )

  belongs_to :item
  belongs_to :collection
  belongs_to :record
  belongs_to :templated_from

  attribute :link do
    @object.is_a? CollectionCard::Link
  end

  attribute :pinned_and_locked do
    @object.pinned_and_locked?
  end

  attribute :is_master_template_card do
    @object.master_template_card?
  end

  # for cached rendering this attribute will get added later
  attribute :can_edit_parent, if: -> { @current_ability } do
    @current_ability.can?(:edit_content, (@parent || @object.try(:parent)))
  end

  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :placeholder_editor_id do
    @object.cached_placeholder_editor_id || nil
  end
end
