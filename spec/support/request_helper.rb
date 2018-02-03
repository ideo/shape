module RequestHelper
  def json
    JSON.parse(response.body)
  end
end
