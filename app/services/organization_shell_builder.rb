class OrganizationShellBuilder
  attr_reader :organization, :errors

  def initialize(params, full_setup)
    @params = params
    @organization = Organization.new(organization_params, blank: true)
    @errors = @organization.errors
    # mainly just in tests that we don't need this overhead
    @full_setup = full_setup
  end

  def save
    result = @organization.transaction do
      # set it to 1 so that it doesn't start off at 0
      @organization.active_users_count = 1
      @organization.save!
      if @full_setup
        create_getting_started_collection
        create_templates
        # this check is for running Cypress, don't create real Network orgs for every test org
        return true if @user.email == 'cypress-test@ideo.com'

        # create_network_organization
        # create_network_subscription
      end
      true
    end
    !result.nil?
  rescue ActiveRecord::RecordInvalid
    # invalid params, transaction will be rolled back
    false
  end

  private

  def setup_user_membership_and_collections
    @organization.setup_user_membership_and_collections(@user)
  end

  def create_getting_started_collection
    Collection::UserCollection.create(
      organization: @organization
    )
  end

  def create_templates
    # Create templates after membership has been setup correctly
    OrganizationTemplates.call(@organization, @user)
    # Probably a organization clone if there is no user
    return if @user.blank?
    # call this additionally to create the UserProfile and Getting Started after the templates have been created
    # TODO: ensure that the user template creator doesn't get called at this point
    @organization.setup_user_membership(@user) unless @user.application_bot?
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

  def organization_params
    return { name: @params[:name] } if @params[:in_app_billing].nil?

    { name: @params[:name], in_app_billing: @params[:in_app_billing] }
  end
end
