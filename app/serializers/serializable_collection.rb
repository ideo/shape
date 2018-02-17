class SerializableCollection < BaseJsonSerializer
  type 'collections'
  attributes :id, :name, :created_at
  belongs_to :organization
  has_many :collection_cards
  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).viewable_to_api
  end
end
