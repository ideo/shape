class SerializableItem < BaseJsonSerializer
  type 'items'
  attributes :id, :type, :name, :content, :text_data, :url
  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).to_api
  end
  belongs_to :filestack_file
end
