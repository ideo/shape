class OrganizationBuilder
  attr_reader :organization, :errors

  def initialize(params, user)
    @organization = Organization.new(params)
    @errors = @organization.errors
    @user = user
  end

  def save
    success = @organization.save
    add_role
    create_collections
    success
  end

  private

  def add_role
    @user.add_role(Role::ADMIN, @organization.primary_group)
  end

  def create_collections
    Collection::UserCollection.find_or_create_for_user(
      @user,
      @organization,
    )
  end
end
