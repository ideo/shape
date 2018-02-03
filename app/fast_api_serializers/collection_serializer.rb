class CollectionSerializer < FastJsonSerializer
  set_type 'collections'
  attributes :name, :created_at
  belongs_to :organization
  has_many :collection_cards
end
