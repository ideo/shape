class Api::V1::SearchController < Api::V1::BaseController
  def search
    render jsonapi: search_collections(params[:query])
  end

  private

  def search_collections(query)
    return [] if query.blank?

    Collection.search(
      query,
      fields: %w[name^5 content],
      where: { organization_id: current_organization.id },
    )
  end
end
