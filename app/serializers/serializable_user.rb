class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :created_at, :current_user_collection_id,
             :status, :pic_url_square, :terms_accepted,
             :show_helper

  attribute :google_auth_token do
    # generate user login token for firebase
    GoogleAuthService.create_custom_token(@object.id)
  end

  belongs_to :current_organization
  has_many :organizations
  has_many :groups do
    data { @object.current_org_groups_and_special_groups }
  end
end
