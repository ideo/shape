class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource except: %i[me search create_from_emails accept_terms]

  # All the users in this org, that this user can 'see' through groups or content
  # /organizations/:id/users
  def index
    # show all other active users in the system
    @users = User.active.where.not(id: current_user.id)
    render jsonapi: @users
  end

  def show
    render jsonapi: @user, include:
      [:groups, current_organization: [:primary_group]]
  end

  def me
    render jsonapi: current_user, include:
      [:groups, current_organization: [:primary_group]]
  end

  def search
    render jsonapi: search_users(params[:query])
  end

  # Create new pending users from email addresses
  def create_from_emails
    cpu = CreatePendingUsers.new(
      emails: json_api_params[:emails],
      organization: current_organization,
    )
    if cpu.call
      render jsonapi: cpu.users
    else
      render_api_errors cpu.failed_emails
    end
  end

  def accept_terms
    if current_user.update(terms_accepted: true)
      render jsonapi: current_user
    else
      render_api_errors current_user.errors
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
