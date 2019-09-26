class OrganizationBuilder
  attr_reader :organization, :errors

  def initialize(params, user, full_setup: true)
    @organization = Organization.new(name: params[:name])
    @errors = @organization.errors
    @user = user
    @params = params
    # mainly just in tests that we don't need this overhead
    @full_setup = full_setup
  end

  def save
    result = @organization.transaction do
      # set it to 1 so that it doesn't start off at 0
      @organization.active_users_count = 1
      @organization.save!
      update_primary_group!
      add_role
      setup_user_membership_and_collections
      create_application_organization if @user.application_bot?
      if @full_setup
        create_templates if !@user.application_bot?
        # this check is for running Cypress, don't create real Network orgs for every test org
        return true if @user.email == 'cypress-test@ideo.com'

        create_network_organization
        create_network_subscription
      else
        @user.current_user_collection(@organization.id).update(
          awaiting_first_user_content: false,
        )
      end
      true
    end
    !result.nil?
  rescue ActiveRecord::RecordInvalid
    # invalid params, transaction will be rolled back
    false
  end

  private

  def update_primary_group!
    @organization.primary_group.attributes = group_params
    @organization.primary_group.save!
  end

  def group_params
    @params.except(:in_app_billing)
  end

  def add_role
    @user.add_role(Role::ADMIN, @organization.primary_group)
  end

  def setup_user_membership_and_collections
    @organization.setup_user_membership_and_collections(@user)
  end

  def create_templates
    # Create templates after membership has been setup correctly
    OrganizationTemplates.call(@organization, @user)
    # call this additionally to create the UserProfile and Getting Started after the templates have been created
    # TODO: ensure that the user template creator doesn't get called at this point
    @organization.setup_user_membership(@user)
  end

  def create_network_organization
    @organization.create_network_organization(@user)
  rescue JsonApiClient::Errors::ApiError
    raise ActiveRecord::Rollback
  end

  def create_network_subscription
    @organization.create_network_subscription
  rescue JsonApiClient::Errors::ApiError
    raise ActiveRecord::Rollback
  end

  def create_application_organization
    ApplicationOrganization.create(
      organization: @organization,
      application: @user.application,
    )
  end
end
