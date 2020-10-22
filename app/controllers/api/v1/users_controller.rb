class Api::V1::UsersController < Api::V1::BaseController
  before_action :authenticate_user!, only: %i[
    update_current_user
    accept_current_org_terms
  ]
  skip_before_action :check_api_authentication!, only: %i[
    me
    update_current_user
    update_survey_respondent
    accept_current_org_terms
    create_limited_user
  ]

  load_and_authorize_resource :organization, only: %i[index]
  def index
    if current_user.application_bot?
      load_and_filter_index
      render jsonapi: @users
    elsif @organization.present?
      users = @organization.users.order(handle: :asc).limit(10_000)
      render jsonapi: users,
             class: {
               User: SerializableSimpleUser,
             }
    else
      head(:unauthorized)
    end
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
    if user_signed_in? || current_api_token.present?
      update_user_last_active_at

      render jsonapi: current_user,
             include: [
               :groups,
               :most_used_templates,
               organizations: %i[primary_group most_used_templates],
               current_organization: %i[primary_group guest_group admin_group terms_text_item],
             ],
             # use Firestoreable which includes all {CollectionType}: SerializableSimpleCollection mappings,
             # needed for including templates
             class: Firestoreable::JSONAPI_CLASS_MAPPINGS.merge(
               User: SerializableCurrentUser,
               Group: SerializableGroup,
               Organization: SerializableOrganization,
               # For org terms_text_item
               'Item::TextItem': SerializableItem,
             )
    else
      render jsonapi: User.new
    end
  end

  # Create new pending users from email addresses
  def create_from_emails
    service = FindOrCreateUsersByEmail.new(
      emails: json_api_params[:emails],
      invited_by: current_user,
    )
    if service.call
      render jsonapi: service.users
    else
      errors = ["unable to process emails: #{service.failed_emails.join(',')}"]
      render json: { errors: errors }, status: :unprocessable_entity
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

  before_action :load_survey_respondent, only: %i[update_survey_respondent]
  def update_survey_respondent
    if @user.update(survey_respondent_user_params)
      render jsonapi: @user, expose: { survey_response: true }
    else
      render_api_errors @user.errors
    end
  end

  def accept_current_org_terms
    if current_user.accept_current_org_terms
      render jsonapi: current_user, class: {
        User: SerializableCurrentUser,
      }
    else
      render_api_errors current_user.errors
    end
  end

  def create_limited_user
    contact_info = json_api_params[:contact_info]
    session_uid = json_api_params[:session_uid]
    feedback_contact_preference = json_api_params[:feedback_contact_preference]
    creator = LimitedUserCreator.new(
      contact_info: contact_info,
      feedback_contact_preference: feedback_contact_preference,
    )
    if creator.call
      if session_uid
        survey_response = SurveyResponse.find_by_session_uid(session_uid)
        survey_response.update(user_id: creator.limited_user.id)
        # run this to capture potential incentive_owed
        SurveyResponseCompletion.call(survey_response)
      end
      render jsonapi: creator.limited_user, expose: {
        survey_response: true,
        created: creator.created,
      }
    else
      logger.info "** ERROR CREATING LIMITED USER #{creator.errors.inspect} **"
      render json: { errors: creator.errors }, status: :unprocessable_entity
    end
  end

  private

  def update_user_last_active_at
    return if current_user.current_organization_id.nil?

    timestamps = current_user.last_active_at || {}
    timestamps = timestamps.merge(
      current_user.current_organization_id.to_s => Time.zone.now,
    )

    current_user.update_attributes(last_active_at: timestamps)
  end

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

  def load_survey_respondent
    if user_signed_in?
      @user = current_user
      return
    end

    survey_response = SurveyResponse.find_by_session_uid(json_api_params[:session_uid])
    @user = survey_response&.user
    head(:unauthorized) if @user.nil?
  end

  def user_params
    json_api_params.require(:user).permit(
      # these are the only fields you would update via the API
      :terms_accepted,
      :show_helper,
      :shape_circle_member,
      :show_move_helper,
      :show_template_helper,
      :notify_through_email,
      :mailing_list,
      :feedback_contact_preference,
      :feedback_terms_accepted,
      :respondent_terms_accepted,
      :locale,
      :use_template_setting,
    )
  end

  def survey_respondent_user_params
    json_api_params.require(:user).permit(
      :feedback_contact_preference,
      :respondent_terms_accepted,
      # eventually, also permit demographics here...
    )
  end
end
