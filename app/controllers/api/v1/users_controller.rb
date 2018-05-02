class Api::V1::UsersController < Api::V1::BaseController
  # All the other users in this org
  # /organizations/:id/users
  load_and_authorize_resource :organization, only: %i[index]
  def index
    # show all other active users in the system
    @users = User.active.where.not(id: current_user.id)
    render jsonapi: @users
  end

  load_and_authorize_resource only: %i[show]
  def show
    render jsonapi: @user, include: [
      :groups,
      :organizations,
      current_organization: [:primary_group],
    ]
  end

  def me
    render jsonapi: current_user, include: [
      :groups,
      organizations: %i[primary_group],
      current_organization: %i[primary_group guest_group],
    ]
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

  before_action :load_and_authorize_organization, only: %i[switch_org]
  def switch_org
    if current_user.switch_to_organization(@organization)
      render jsonapi: current_user, include:
        [:groups, organizations: [:primary_group], current_organization: %i[primary_group guest_group]]
    else
      render_api_errors current_user.errors
    end
  end

  private

  def load_and_authorize_organization
    @organization = Organization.find(json_api_params[:organization_id])
    authorize! :read, @organization
  end

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
