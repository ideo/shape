class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :id, :order, :width, :height, :parent_id, :type

  attribute :link do
    @object.is_a? CollectionCard::Link
  end

  belongs_to :item
  belongs_to :collection
  belongs_to :parent
  belongs_to :record
end
