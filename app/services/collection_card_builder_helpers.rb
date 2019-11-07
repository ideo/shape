# These methods are intended to be used in interactors

module CollectionCardBuilderHelpers
  def create_card(params:, parent_collection:, created_by:)
    builder = CollectionCardBuilder.new(
      params: params,
      parent_collection: parent_collection,
      user: created_by,
    )

    builder.create

    return builder.collection_card if builder.errors.blank?

    context.fail!(
      message: builder.errors.to_sentence,
    )
  end
end
