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
      @organization.save!
      update_primary_group!
      add_role
      setup_user_membership_and_collections
      create_templates
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
    # Create templates after memership has been setup correctly
    @organization.setup_templates(@user)
  end
end
