class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :created_at, :current_user_collection_id,
             :status, :pic_url_square
  belongs_to :current_organization
  has_many :organizations
  has_many :groups do
    data { @object.current_org_groups }
  end
end
