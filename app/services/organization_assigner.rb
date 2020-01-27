class OrganizationAssigner < SimpleService
  def initialize(params, user, full_setup)
    @params = params
    @user = user
    @organization = Organization.where(blank: true).first
    @full_setup = full_setup
  end

  def call
    result = @organization.transaction do
      update_organization_information
      update_primary_group!
      add_role
      setup_user_membership_and_collections
      create_application_organization if @user.application_bot?

      if @full_setup
        create_templates
        # this check is for running Cypress, don't create real Network orgs for every test org
        return true if @user.email == 'cypress-test@ideo.com'

        create_network_organization
        create_network_subscription
      else
        @user.current_user_collection(@organization.id).update(
          loading_content: false,
        )
      end
      OrganizationShellWorker.perform_async
    end
    !result.nil?
  rescue ActiveRecord::RecordInvalid
    # invalid params, transaction will be rolled back
    false
  end

  private

  def group_params
    @params.except(:in_app_billing)
  end

  def organization_params
    return { name: @params[:name] } if @params[:in_app_billing].nil?

    { name: @params[:name], in_app_billing: @params[:in_app_billing] }
  end

  def update_organization_information
    @organization.update(organization_params)
  end

  def update_primary_group!
    @organization.primary_group.attributes = group_params
    @organization.primary_group.save!
  end

  def add_role
    @user.add_role(Role::ADMIN, @organization.primary_group)
  end

  def setup_user_membership_and_collections
    @organization.setup_user_membership_and_collections(@user)
  end

  def create_network_organization
    @organization.create_network_organization(@user)
  rescue JsonApiClient::Errors::ApiError
    raise ActiveRecord::Rollback unless Rails.env.development?
  end

  def create_network_subscription
    @organization.create_network_subscription
  rescue JsonApiClient::Errors::ApiError
    raise ActiveRecord::Rollback unless Rails.env.development?
  end

  def create_application_organization
    ApplicationOrganization.create(
      organization: @organization,
      application: @user.application,
    )
  end
end
