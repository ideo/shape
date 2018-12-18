class Api::V1::SearchController < Api::V1::BaseController
  def search
    results = search_records(params[:query])
    render(
      meta: {
        page: page,
        total: results.total_count,
        size: results.size,
      },
      jsonapi: results,
      include: %i[parent_collection_card filestack_file],
      class: jsonapi_class.merge(
        Collection: SerializableSimpleCollection,
      ),
      expose: {
        force_breadcrumbs: true,
      },
    )
  end

  def users_and_groups
    results = search_users_and_groups(params[:query])
    render(
      meta: {
        page: page,
        total: results.total_count,
        size: results.size,
      },
      jsonapi: results,
    )
  end

  private

  def page
    params[:page].present? ? params[:page].to_i : 1
  end

  def search_records(query)
    # search for tags via hashtag e.g. "#template"
    where_clause = {
      organization_id: current_organization.id,
    }
    # super_admin has access to everything regardless of user/group_ids
    unless current_user.has_cached_role?(Role::SUPER_ADMIN)
      where_clause[:_or] = [
        { user_ids: [current_user.id] },
        { group_ids: current_user_current_group_ids },
      ]
    end

    Search.new(
      # NOTE: This index may get replaced based on filters e.g. "type:item"
      index_name: Collection,
      where: where_clause,
      per_page: params[:per_page] || 10,
      page: page,
    ).search(query)
  end

  def search_users_and_groups(query)
    indexes = [User]
    indexes << Group unless params[:users_only]
    Search.new(
      index_name: indexes,
      match: :word_start,
      where: {
        organization_ids: [current_organization.id],
      },
      per_page: 6,
    ).search(query)
  end

  def current_user_current_group_ids
    current_user.organization_group_ids(
      current_user.current_organization,
    )
  end
end
