module ApplicationHelper
  # NOTE: this is somewhat similar to RoutingStore.js by necessity
  def frontend_url_for(obj, with_id: true, slug: nil)
    return admin_root_url if obj == Role::SHAPE_ADMIN.to_s.titleize

    "#{root_url.chomp('/')}#{frontend_path_for(obj, with_id: with_id, slug: slug)}"
  end

  def frontend_path_for(obj, with_id: true, slug: nil)
    slug ||= obj&.organization&.slug
    url = ''
    url += "/#{slug}" if slug
    obj_id = with_id ? "/#{obj.id}" : ''
    if obj.is_a? Collection
      url += "/collections#{obj_id}"
    elsif obj.is_a? Item
      url += "/items#{obj_id}"
    end
    url
  end

  def javascript_packs_with_polyfill(*packs)
    javascript_packs_with_chunks_tag 'babel-polyfill', *packs
  end
end
