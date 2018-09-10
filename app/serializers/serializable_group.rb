class SerializableGroup < BaseJsonSerializer
  type 'groups'
  attributes :name, :handle
  attribute :is_primary do
    @object.primary?
  end
  attribute :is_guest do
    @object.guest?
  end
  attribute :is_admin do
    @object.admin?
  end
  attribute :filestack_file_url do
    if @object.filestack_file_url.present?
      @object.filestack_file_url
    else
      'https://s3-us-west-2.amazonaws.com/assets.shape.space/group-avatar.png'
    end
  end
  has_many :roles

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end
end
