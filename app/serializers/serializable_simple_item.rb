class SerializableSimpleItem < BaseJsonSerializer
  type 'items'
  attributes :type, :name, :content,
             :url, :thumbnail_url, :icon_url, :question_type
  attribute :filestack_file_url do
    @object.cached_filestack_file_url || ''
  end
end
