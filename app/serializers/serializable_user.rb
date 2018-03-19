class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :id, :first_name, :last_name, :email,
             :created_at,
             :current_user_collection_id, :status
  belongs_to :current_organization
  attribute :pic_url_square do
    if @object.pic_url_square
      @object.pic_url_square
    else
      'https://d3none3dlnlrde.cloudfront.net/assets/users/avatars/missing/square.jpg'
    end
  end
  has_many :organizations
end
