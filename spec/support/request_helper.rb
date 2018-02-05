module RequestHelper
  def json
    JSON.parse(response.body)
  end

  def json_included_objects_of_type(type)
    return [] if json['included'].blank?

    json['included'].select do |obj|
      obj['type'] == type
    end
  end
end
