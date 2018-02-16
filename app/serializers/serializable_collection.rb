class SerializableCollection < BaseJsonSerializer
  type 'collections'
  attributes :id, :name, :created_at
  belongs_to :organization
  has_many :collection_cards
  attribute :breadcrumb do
    @object.breadcrumb_for_user(@current_user)
  end
end
