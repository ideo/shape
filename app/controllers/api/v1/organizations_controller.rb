class Api::V1::OrganizationsController < Api::V1::BaseController
  deserializable_resource :organization, only: %i[create update]
  load_and_authorize_resource except: %i[create]

  # The logged-in user's current organization context
  def current
    render jsonapi: current_organization, include: %i[primary_group terms_text_item]
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
    builder = OrganizationBuilder.new(organization_params, current_user)
    if builder.save
      render jsonapi: builder.organization, include: [:primary_group]
    else
      render_api_errors builder.errors
    end
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

  def check_payments
    @organization.update_payment_status
    render jsonapi: @organization
  end

  private

  def organization_params
    params_allowed = [
      :name,
      :domain_whitelist,
      :handle,
      :deactivated,
      :terms_text_item_id,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    ]
    params_allowed << :in_app_billing if current_user.has_role?(Role::SUPER_ADMIN)
    params.require(:organization).permit(params_allowed)
  end
end
