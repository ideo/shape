class OrganizationBuilder
  attr_reader :organization, :errors

  def initialize(params, user, with_templates: true)
    @organization = Organization.new(name: params[:name])
    @errors = @organization.errors
    @user = user
    @params = params
    # mainly just in tests that we don't need this overhead
    @with_templates = with_templates
  end

  def save
    @organization.transaction do
      @organization.save!
      update_primary_group!
      add_role
      setup_user_membership_and_collections
    end
    create_templates if @with_templates
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
    OrganizationTemplates.call(@organization, @user)
    # call this additionally to create the UserProfile and Getting Started after the templates have been created
    # TODO: ensure that the user template creator doesn't get called at this point
    @organization.setup_user_membership(@user)
  end
end
