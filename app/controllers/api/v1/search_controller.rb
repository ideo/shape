class Api::V1::SearchController < Api::V1::BaseController
  before_action :capture_query_params

  def search
    results = search_records
    render(
      meta: {
        page: @page,
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

  before_action :authorize_resource, only: :users_and_groups
  def users_and_groups
    @indexes = [User]
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

  private

  def capture_query_params
    @query = params[:query] || ''
    @page = params[:page].present? ? params[:page].to_i : 1
  end

  def search_records
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
      page: @page,
    ).search(@query)
  end

  def search_users_and_groups
    Search.new(
      index_name: @indexes,
      fields: %w[name^5 email^2 handle],
      match: :word_start,
      where: {
        organization_ids: [current_organization.id],
      },
      per_page: 6,
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
    if @resource.is_a?(Group)
      search_opts[:index_name] = [User]
      search_opts[:where] = {
        status: status,
        group_ids: [@resource.id],
      }
    else
      search_opts[:where] = {
        _or: [
          {
            _type: 'user',
            _id: @resource.search_user_ids,
            status: status,
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
    end

    results = Search.new(search_opts).search(@query)

    users = results.select { |r| r.is_a? User }
    groups = results.select { |r| r.is_a? Group }

    # The end result is we render the roles with their attached users/groups
    render(
      meta: {
        page: @page,
        total: results.total_count,
        size: results.size,
      },
      jsonapi: @resource.anchored_roles,
      include: %i[users groups],
      expose: {
        user_ids: users.pluck(:id),
        group_ids: groups.pluck(:id),
      },
    )
  end

  def current_user_current_group_ids
    current_user.organization_group_ids(
      current_user.current_organization,
    )
  end

  def authorize_resource
    return unless params[:resource_id] && params[:resource_type]
    @resource = params[:resource_type].constantize.find params[:resource_id]
    authorize! :read, @resource
  end
end
