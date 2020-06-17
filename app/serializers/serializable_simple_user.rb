class SerializableSimpleUser < BaseJsonSerializer
  type 'users'
  attributes :first_name, :last_name, :handle

  attribute :pic_url_square do
    @object.picture || 'https://s3-us-west-2.amazonaws.com/assets.shape.space/user-avatar.png'
  end
end
