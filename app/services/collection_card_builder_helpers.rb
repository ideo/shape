# These methods are intended to be used in interactors

module CollectionCardBuilderHelpers
  def create_card(params:, parent_collection:, created_by: nil, type: 'primary')
    if params[:collection_attributes]
      params[:collection_attributes][:num_columns] = 4
    end
    builder = CollectionCardBuilder.new(
      params: params,
      parent_collection: parent_collection,
      user: created_by || parent_collection.created_by,
      type: type,
    )

    builder.create
    parent_collection.reload

    return builder.collection_card if builder.errors.blank?

    context.fail!(
      message: builder.errors.full_messages.to_sentence,
    )
  end
end
