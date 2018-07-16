class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :created_at, :status,
             :handle

  attribute :pic_url_square do
    @object.pic_url_square || 'https://s3-us-west-2.amazonaws.com/assets.shape.space/user-avatar.png'
  end

  belongs_to :current_organization
  has_many :organizations
  has_many :groups do
    data { @object.current_org_groups_and_special_groups }
  end

  attribute :user_profile_collection_id do
    if @current_user.blank?
      nil
    else
      hash = @object.cached_user_profiles || {}
      hash[@current_user.current_organization_id.to_s]
    end
  end
end
