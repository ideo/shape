class SerializableItem < BaseJsonSerializer
  ROLES_LIMIT = 5
  type 'items'
  attributes :id, :type, :name, :content, :text_data,
             :url, :thumbnail_url

  cached_attribute :filestack_file_url, :tag_list

  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).viewable_to_api
  end

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end

  has_many :roles
end
