class SerializableCollection < BaseJsonSerializer
  type 'collections'
  attributes :id, :name, :created_at
  belongs_to :organization
  has_many :collection_cards
  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).to_api
  end
  has_many :editors do
    data { @object.editors }
  end
  has_many :viewers do
    data { @object.viewers }
  end
end
