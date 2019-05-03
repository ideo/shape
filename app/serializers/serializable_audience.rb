class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes :name, :price_per_response, :criteria
end
