class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :created_at, :status, :pic_url_square,
             :handle

  belongs_to :current_organization
  has_many :organizations
  has_many :groups do
    data { @object.current_org_groups_and_special_groups }
  end

  attribute :user_profile_collection_id do
    @object.user_profile_for_org(@current_user.current_organization_id).try(:id)
  end
end
