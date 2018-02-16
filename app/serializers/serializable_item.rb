class SerializableItem < BaseJsonSerializer
  type 'items'
  attributes :id, :type, :name, :content
  attribute :breadcrumb do
    @object.breadcrumb_for_user(@current_user)
  end
end
