class Api::V1::SearchController < Api::V1::BaseController
  def search
    results = search_collections(params[:query])
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

  def search_collections(query)
    Collection.search(
      query,
      fields: %w[name^5 tags^3 content],
      where: {
        organization_id: current_organization.id,
        _or: [
          { user_ids: [current_user.id] },
          { group_ids: current_user_current_group_ids },
        ],
      },
      per_page: 10,
      page: page,
    )
  end

  def current_user_current_group_ids
    current_user.organization_group_ids(
      current_user.current_organization,
    )
  end
end
