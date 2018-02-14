class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :pic_url_square, :created_at,
             :current_user_collection_id
  belongs_to :current_organization
  has_many :organizations
end
