class Api::V1::SearchController < Api::V1::BaseController
  def search
    results = search_collections(params[:query])
    render(
      meta: {
        page: page,
        total: results.total_count,
        size: results.size,
      },
      jsonapi: results, include: [:parent_collection_card]
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

  def search_collections(query)
    tags = query.scan(/#\w+/).flatten.map { |tag| tag.delete('#') }
    where_clause = {
      organization_id: current_organization.id,
    }
    if !current_user.has_role?(Role::SUPER_ADMIN)
      where_clause[:_or] = [
        { user_ids: [current_user.id] },
        { group_ids: current_user_current_group_ids },
      ]
    end
    where_clause[:tags] = { all: tags } if tags.count.positive?
    untagged_query = query.sub(/#\w+\s/, '')
    Collection.search(
      untagged_query,
      fields: %w[name^5 tags^3 content],
      where: where_clause,
      per_page: 10,
      page: page,
    )
  end

  def search_users_and_groups(query)
    Searchkick.search(
      query,
      index_name: [User, Group],
      match: :word_start,
      fields: %w[handle^5 name],
      where: {
        organization_ids: [current_organization.id],
      },
      per_page: 6,
    )
  end

  def current_user_current_group_ids
    current_user.organization_group_ids(
      current_user.current_organization,
    )
  end
end
