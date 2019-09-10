class BaseJsonSerializer < JSONAPI::Serializable::Resource
  extend JSONAPI::Serializable::Resource::ConditionalFields
  include CachedAttributes

  # we can't call this STI field "type" otherwise it will confuse json_api_client.
  # so we refer to it as "class_type" and then have methods for referring to it as "type"
  # on the frontend
  attribute :class_type, if: -> { @object.class.method_defined?(:type) } do
    @object.type || @object.class.name
  end
end
