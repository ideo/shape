class BaseJsonSerializer < JSONAPI::Serializable::Resource
  extend JSONAPI::Serializable::Resource::ConditionalFields
  include CachedAttributes

  # we can't call this STI field "type" otherwise it will confuse json_api_client.
  # so we refer to it as "class_type" and then have methods for referring to it as "type"
  # on the frontend
  attribute :class_type, if: -> { @object.class.method_defined?(:type) } do
    @object.type || @object.class.name
  end

  def self.stringified_attributes(*attrs)
    attrs.each do |attr|
      attribute attr do
        @object.send(attr)&.to_s
      end
    end
  end
end
