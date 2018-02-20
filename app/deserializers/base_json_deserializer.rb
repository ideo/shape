class BaseJsonDeserializer < JSONAPI::Deserializable::Resource
  # deserialize attributes of this model for parsing
  # e.g. { "type" => "collections", "attributes" => { "name" => "..." } }
  # will include "name" in params[:collections]
  attributes
end
