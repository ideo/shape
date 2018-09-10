module ApiHelper
  def json
    JSON.parse(response.body)
  end

  def json_included_objects_of_type(type)
    return [] if json['included'].blank?

    json['included'].select do |obj|
      obj['type'] == type
    end
  end

  def json_object_ids
    json['data'].map { |obj| obj['id'].to_i }
  end

  def json_api_params(resource_name, attrs, merge_data = {})
    params = {
      data: {
        type: resource_name,
        attributes: attrs
      }.merge(merge_data)
    }.to_json
  end
end
