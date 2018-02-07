class BaseJsonDeserializer < JSONAPI::Deserializable::Resource
  # deserialize attributes of this model for parsing
  # e.g. { "type" => "collections", "attributes" => { "name" => "..." } }
  # will include "name" in params[:collections]
  attributes

  def deserialize_has_many_rel(key, val)
    return {} unless val['data'].is_a?(Array)

    # pull in all nested_attrs (e.g. 'id', 'order'), removing 'type' from the relationship
    nested_attrs = val['data'].map do |ri|
      ri.delete('type')
      ri
    end

    hash = { "#{self.class.key_formatter.call(key)}_attributes" => nested_attrs }
    register_mappings(hash.keys, "/relationships/#{key}")
    hash
  end
end
