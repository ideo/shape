# These methods are intended to be used in interactors

module CollectionCardBuilderHelpers
  def create_card(params:, parent_collection:, created_by: nil, type: 'primary')
    if params[:collection_attributes]
      params[:collection_attributes][:num_columns] = 4
    end
    builder = CollectionCardBuilder.new(
      params: params,
      parent_collection: parent_collection,
      user: created_by || parent_collection&.created_by,
      type: type,
    )

    builder.create
    parent_collection.reload

    return builder.collection_card if builder.errors.blank?

    context.fail!(
      message: builder.errors.full_messages.to_sentence,
    )
  end

  def find_or_create_card(params:, parent_collection:, created_by: nil, type: 'primary')
    klass = type == 'primary' ? CollectionCard::Primary : CollectionCard::Link
    found_card = klass.find_by(
      parent: parent_collection,
      collection_id: params[:collection_id],
      item_id: params[:item_id],
    )
    return found_card if found_card.present?

    create_card(
      params: params,
      parent_collection: parent_collection,
      created_by: created_by,
      type: type
    )
  end
end
