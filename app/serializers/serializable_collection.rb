class SerializableCollection < BaseJsonSerializer
  ROLES_LIMIT = 5
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
  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end
  has_many :editors do
    data { @object.editors.first(ROLES_LIMIT) }
  end
  has_many :viewers do
    data { @object.viewers.first(ROLES_LIMIT) }
  end
end
