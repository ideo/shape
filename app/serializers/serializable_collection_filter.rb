class SerializableCollectionFilter < BaseJsonSerializer
  type 'collection_filters'
  attributes(
    :text,
    :filter_type,
  )

  attribute :selected do
    user_filter = UserCollectionFilter.find_by(
      user_id: @current_user.id,
      collection_filter_id: @object.id,
    )
    user_filter.present? ? user_filter.selected : false
  end
end
