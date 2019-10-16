class SerializableCollectionFilter < BaseJsonSerializer
  type 'collection_filters'
  attributes(
    :text,
    :filter_type
  )

  attribute :selected do
    # TODO maybe get current_user here and check that it's selected?
    true
  end

  belongs_to :collection
end
