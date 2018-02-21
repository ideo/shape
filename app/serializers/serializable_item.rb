class SerializableItem < BaseJsonSerializer
  type 'items'
  attributes :id, :type, :name, :content
  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).viewable_to_api
  end
end
