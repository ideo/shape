class Api::V1::SearchController < Api::V1::BaseController
  def search
    # NOTE: currently just searches collections
    render jsonapi: search_collections(params[:query])
  end

  private

  def search_collections(query)
    return [] if query.blank?

    Collection.search(
      query.downcase,
      fields: ['name^2', :content],
      where: { organization_id: current_organization.id },
    )
  end
end
