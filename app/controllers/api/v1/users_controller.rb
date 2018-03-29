class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource except: %i[me search create_from_emails]

  # All the users in this org, that this user can 'see' through groups or content
  # /organizations/:id/users
  def index
    @users = current_user.users_through_collections_items_and_groups(current_organization)
    render jsonapi: @users
  end

  def show
    render jsonapi: @user, include: %i[current_organization groups]
  end

  def me
    render jsonapi: current_user, include: %i[current_organization groups]
  end

  def search
    render jsonapi: search_users(params[:query])
  end

  # Create new pending users from email addresses
  def create_from_emails
    cpu = CreatePendingUsers.new(json_api_params[:emails])
    if cpu.call
      render jsonapi: cpu.users
    else
      render_api_errors cpu.failed_emails
    end
  end

  private

  def json_api_params
    params[:_jsonapi]
  end

  def search_users(query)
    return [] if query.blank?

    User.search(
      query.downcase,
      fields: ['name^2', { email: :exact }],
      match: :word_start,
      where: { organization_ids: current_organization.id },
    )
  end
end
