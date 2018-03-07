class SerializableItem < BaseJsonSerializer
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
    data { @object.editors }
  end
  has_many :viewers do
    data { @object.viewers }
  end
end
