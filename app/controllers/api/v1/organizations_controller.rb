class Api::V1::OrganizationsController < Api::V1::BaseController
  deserializable_resource :organization, only: %i[create update]
  load_and_authorize_resource except: %i[create my_collection admin_users]

  before_action :load_user_organizations, only: %i[index]
  before_action :load_and_filter_index, only: %i[index]
  def index
    render jsonapi: @organizations, expose: { include_user_collection_ids: true }
  end

  # The logged-in user's current organization context
  def current
    render jsonapi: current_organization, include: %i[primary_group terms_text_item most_used_templates]
  end

  def show
    render jsonapi: @organization, include: [:terms_text_item]
  end

  def update
    @organization.attributes = organization_params

    if @organization.save
      render jsonapi: @organization
    else
      render_api_errors @organization.errors
    end
  end

  def create
    assigner = OrganizationAssigner.new(
      organization_params,
      current_user,
    )
    if assigner.call
      meta = {}
      if session[:use_template_id]
        meta[:use_template_id] = session[:use_template_id]
      end
      render jsonapi: assigner.organization.reload,
             include: [:primary_group],
             meta: meta
    else
      render_api_errors assigner.errors
    end
  end

  before_action :load_and_authorize_organization_from_slug, only: %i[my_collection]
  def my_collection
    redirect_to api_v1_collection_path(
      current_user.current_user_collection(@organization.id),
      page_view: params[:page_view],
    )
  end

  def add_terms_text
    if @organization.create_terms_text_item
      render jsonapi: @organization, include: [:terms_text_item]
    else
      render_api_errors @organization.errors
    end
  end

  def remove_terms_text
    @organization.terms_text_item = nil
    @organization.terms_text_item_id = nil
    if @organization.save
      render jsonapi: @organization
    else
      render_api_errors @organization.errors
    end
  end

  def bump_terms_version
    if @organization.bump_terms_version
      current_user.reload.accept_current_org_terms
      render jsonapi: @organization
    else
      render_api_errors @organization.errors
    end
  end

  def check_payments
    @organization.update_payment_status
    render jsonapi: @organization
  end

  def admin_users
    admin_users = @organization ? @organization.admin_users : Organization.find(@current_user.current_organization_id).admin_users
    render jsonapi: admin_users
  end

  private

  def load_user_organizations
    @organizations = current_user.organizations
  end

  def organization_params
    params_allowed = [
      :name,
      :deactivated,
      :terms_text_item_id,
      :default_locale,
      :handle,
      domain_whitelist: [],
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    ]
    # If super admin or application (bot) user, we allow toggling billing
    if current_user.has_role?(Role::SUPER_ADMIN) || current_application.present?
      params_allowed << :in_app_billing
    end
    params.require(:organization).permit(params_allowed)
  end
end
