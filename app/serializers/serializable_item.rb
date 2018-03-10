class SerializableItem < BaseJsonSerializer
  ROLES_LIMIT = 5
  type 'items'
  attributes :id, :type, :name, :content, :text_data, :url, :thumbnail_url
  belongs_to :filestack_file
  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object.breadcrumb,
      @current_user,
    ).to_api
  end
  has_many :editors do
    data { @object.editors.first(ROLES_LIMIT) }
  end
  has_many :viewers do
    data { @object.viewers.first(ROLES_LIMIT) }
  end
end
