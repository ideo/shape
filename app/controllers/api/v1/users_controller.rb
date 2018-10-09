class Api::V1::UsersController < Api::V1::BaseController
  # All the other users in this org
  # /organizations/:id/users
  load_and_authorize_resource :organization, only: %i[index]
  def index
    # show all other active users in the system
    # i.e. like Trello, is not limited to your org but anyone who's registered
    @users = User.all_active_except(current_user.id, in_org: @organization)
    render jsonapi: @users, fields:
      {
        users: User.basic_api_fields,
      }
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
      current_organization: %i[primary_group guest_group admin_group],
    ], class: {
      User: SerializableCurrentUser,
      Group: SerializableGroup,
      Organization: SerializableOrganization,
    }
  end

  def search
    render jsonapi: search_users(params[:query])
  end

  # Create new pending users from email addresses
  def create_from_emails
    cpu = CreatePendingUsers.new(
      emails: json_api_params[:emails],
    )
    if cpu.call
      render jsonapi: cpu.users
    else
      render_api_errors cpu.failed_emails
    end
  end

  # since the only user you can update via the API is yourself, this keeps it simple
  def update_current_user
    if current_user.update(user_params)
      render jsonapi: current_user, class: {
        User: SerializableCurrentUser,
      }
    else
      render_api_errors current_user.errors
    end
  end

  before_action :load_and_authorize_organization, only: %i[switch_org]
  def switch_org
    if current_user.switch_to_organization(@organization)
      render jsonapi: current_user,
             include: [
               :groups, organizations: [:primary_group], current_organization: %i[primary_group guest_group]
             ],
             class: {
               User: SerializableCurrentUser,
               Group: SerializableGroup,
               Organization: SerializableOrganization,
             }
    else
      render_api_errors current_user.errors
    end
  end

  private

  def load_and_authorize_organization
    # NOTE: friendly.find can cause issues here e.g. a slug of "1"
    @organization = Organization.find(json_api_params[:organization_id])
    authorize! :read, @organization
  end

  def user_params
    json_api_params.require(:user).permit(
      # these are the only fields you would update via the API
      :terms_accepted,
      :show_helper,
      :show_move_helper,
      :show_template_helper,
      :notify_through_email,
      :mailing_list,
    )
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
