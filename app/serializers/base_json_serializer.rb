class BaseJsonSerializer < JSONAPI::Serializable::Resource
  include CachedAttributes
end
