class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes :name, :criteria, :tag_list

  attribute :price_per_response do
    @object.price_per_response.to_f
  end

  attribute :global do
    @object.organizations.empty?
  end
end
