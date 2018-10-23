class OrganizationBuilder
  attr_reader :organization, :errors

  def initialize(params, user)
    @organization = Organization.new(name: params[:name])
    @errors = @organization.errors
    @user = user
    @params = params
  end

  def save
    @organization.transaction do
      @organization.trial_ends_at = Organization::DEFAULT_TRIAL_ENDS_AT.from_now
      @organization.trial_users_count = Organization::DEFAULT_TRIAL_USERS_COUNT
      @organization.save!
      update_primary_group!
      add_role
      setup_user_membership_and_collections
      create_templates
      create_network_organization
      create_network_subscription
    end
    true
  rescue ActiveRecord::RecordInvalid
    # invalid params, transaction will be rolled back
    false
  end

  private

  def update_primary_group!
    @organization.primary_group.attributes = @params
    @organization.primary_group.save!
  end

  def add_role
    @user.add_role(Role::ADMIN, @organization.primary_group)
  end

  def setup_user_membership_and_collections
    @organization.setup_user_membership_and_collections(@user)
  end

  def create_templates
    # Create templates after membership has been setup correctly
    OrganizationTemplates.call(@organization)
    # call this additionally to create the UserProfile after the templates have been created
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
end
