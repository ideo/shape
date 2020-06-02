class Api::V1::SearchController < Api::V1::BaseController
  before_action :capture_query_params
  before_action :load_and_authorize_organization_from_slug, only: %i[search]
  load_and_authorize_resource :organization, only: %i[search_collection_cards]
  before_action :switch_to_organization, only: %i[search search_collection_cards]

  def search
    render json: cached_card_json(search_records)
  end

  def search_collection_cards
    results = search_records(index_name: [Collection, Item])
    render json: cached_card_json(results)
  end

  before_action :authorize_resource, only: :users_and_groups
  def users_and_groups
    @indexes = []
    @indexes << User unless params[:groups_only]
    @indexes << Group unless params[:users_only]
    return search_users_and_groups_for_resource if @resource

    results = search_users_and_groups
    render(
      meta: {
        page: @page,
        total: results.total_count,
        size: results.size,
      },
      jsonapi: results,
    )
  end

  before_action :authenticate_super_admin!, only: %i[organizations]
  def organizations
    # very simple text search for now, just for admin usage
    results = Organization
              .where('LOWER(name) LIKE LOWER(?)', "%#{params[:query]}%")
              .order('LOWER(name) ASC')
              .limit(10)
    render jsonapi: results, include: %i[primary_group]
  end

  private

  def capture_query_params
    @query = params[:query] || ''
  end

  def search_records(index_name: Collection)
    results = Search.new(
      # NOTE: This index may get replaced based on filters e.g. "type:item"
      index_name: index_name,
      where: where_opts,
      per_page: per_page(10),
      page: @page,
      order: order_opts,
      model_includes: {
        Collection: CollectionCard.default_includes_for_api[:collection],
        Item: CollectionCard.default_includes_for_api[:item],
      },
    ).search(@query)
    results
  end

  def order_opts
    options = { _score: :desc }

    if params[:order_by].present? && params[:order_direction].present?
      options = { params[:order_by] => params[:order_direction] }
    end

    options
  end

  def where_opts
    where_clause = {
      organization_id: current_organization.id,
      archived: false,
    }

    if params[:type].present?
      where_clause[:type] = params[:type]
    end

    if params[:show_archived].present?
      # Only show deleted content when this is included
      where_clause[:archived] = true
    end

    if params[:master_template].present?
      where_clause[:master_template] = params[:master_template]
      if params[:master_template]
        # only include normal/board collections when searching master_template = true
        where_clause[:_or] ||= []
        where_clause[:_or] << { type: nil }
        where_clause[:_or] << { type: 'Collection::Board' }
      end
    end

    # super_admin has access to everything regardless of user/group_ids
    unless current_user.has_cached_role?(Role::SUPER_ADMIN)
      where_clause[:_or] ||= []
      where_clause[:_or] << { user_ids: [current_user.id] }
      where_clause[:_or] << { group_ids: current_user.all_current_org_group_ids }
    end

    if params[:current_collection_id].present?
      where_clause[:parent_id] = { not: params[:current_collection_id] }
      where_clause[:id] = { not: params[:current_collection_id] }
    end

    where_clause
  end

  def search_users_and_groups
    Search.new(
      index_name: @indexes,
      fields: %w[name^5 email^2 handle],
      match: :word_start,
      where: {
        # TODO: enable way to surface global groups e.g. Common Resource
        organization_ids: [current_organization.id],
      },
      per_page: per_page(6),
      page: @page,
    ).search(@query)
  end

  def search_users_and_groups_for_resource
    status = params[:status] || 'active'
    search_opts = {
      index_name: [User],
      fields: %w[name^5 email^2 handle],
      match: :word_start,
      order: [
        name: :asc,
      ],
      per_page: 50,
      page: @page,
    }
    if status == 'pending'
      search_opts[:order] << { email: :asc }
    end
    search_opts[:where] = {
      _or: [
        {
          # NOTE: in ES 7+ this `_type` will no longer work! could use _index
          # https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-index-field.html
          _type: 'user',
          _id: @resource.search_user_ids,
          status: status,
          application_bot: false,
        },
      ],
    }
    if status == 'active'
      search_opts[:index_name] << Group
      search_opts[:where][:_or] << {
        _type: 'group',
        _id: @resource.search_group_ids,
      }
    end

    results = Search.new(search_opts).search(@query)

    users = results.select { |r| r.is_a? User }
    groups = results.select { |r| r.is_a? Group }

    # The end result is we render the roles with their attached users/groups
    render(
      meta: {
        page: @page,
        total: results.total_count,
        total_pages: results.total_pages,
        size: results.size,
      },
      jsonapi: @resource.anchored_roles,
      include: [
        :users,
        :resource,
        groups: :application,
      ],
      expose: {
        user_ids: users.pluck(:id),
        group_ids: groups.pluck(:id),
      },
    )
  end

  def authorize_resource
    return unless params[:resource_id] && params[:resource_type]

    @resource = params[:resource_type].constantize.find params[:resource_id]
    authorize! :read, @resource
  end

  def switch_to_organization
    return unless @organization.present?

    current_user.switch_to_organization(@organization)
  end

  def cached_card_json(results)
    records = results.results.compact
    # we searched for Collection/Item results, however we want to
    # map those onto their parent cards as that's what we render
    cards = records.map do |result|
      card = result.parent_collection_card
      # parent card will be nil e.g. for some Global Collections
      if card.nil?
        card = CollectionCard.new
      end
      # make sure card.record is cached on there since we have it already
      if result.is_a?(Collection)
        card.collection = result
      else
        card.item = result
      end
      card
    end.compact

    json_data = JsonapiCache::CollectionCardRenderer.call(
      cards: cards,
      user: current_user,
      search_records: records,
    ).merge(
      meta: {
        page: @page,
        total: results.total_count,
        total_pages: results.total_pages,
        size: results.size,
      },
      links: jsonapi_pagination(results),
    )

    json_data
  end

  def per_page(default)
    per_page = params[:per_page].to_i
    if per_page <= 0
      default
    elsif per_page > 100
      100
    else
      per_page
    end
  end
end
