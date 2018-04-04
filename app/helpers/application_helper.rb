module ApplicationHelper
  # NOTE: this is somewhat similar to RoutingStore.js by necessity
  def frontend_url_for(obj)
    url = root_url
    if obj.is_a? Collection
      url += "collections/#{obj.id}"
    elsif obj.is_a? Item
      url += "items/#{obj.id}"
    end
    url
  end
end
