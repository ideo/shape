class BaseJsonSerializer < JSONAPI::Serializable::Resource
  extend JSONAPI::Serializable::Resource::ConditionalFields
  include CachedAttributes
end
