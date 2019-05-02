class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource only: %i[show]
  def show
    render jsonapi: @user, include: [
      :groups,
      :organizations,
      current_organization: [:primary_group],
    ]
  end

  def me
    current_user.update_attributes(last_active_at: Time.current)
    render jsonapi: current_user, include: [
      :groups,
      organizations: %i[primary_group],
      current_organization: %i[primary_group guest_group admin_group terms_text_item],
    ], class: {
      User: SerializableCurrentUser,
      Group: SerializableGroup,
      Organization: SerializableOrganization,
      'Item::TextItem': SerializableItem,
    }
  end

  # Create new pending users from email addresses
  def create_from_emails
    service = FindOrCreateUsersByEmail.new(
      emails: json_api_params[:emails],
    )
    if service.call
      render jsonapi: service.users
    else
      render_api_errors service.failed_emails
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
    # NOTE: friendly.find can cause issues here with numeric slugs e.g. "1", so we check for that
    # (these numeric slugs should also be eliminated by new validation rules)
    id = json_api_params[:organization_id]
    if id.is_a?(Integer) || id.to_s.match?(/^[0-9]+$/)
      @organization = Organization.find(id)
    else
      @organization = Organization.friendly.find(id)
    end
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
      :feedback_contact_preference,
    )
  end
end
