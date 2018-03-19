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
      fields: %w[name^5 content],
      where: {
        organization_id: current_organization.id,
        user_ids: [current_user.id],
      },
      per_page: 3,
      page: page,
    )
  end
end
