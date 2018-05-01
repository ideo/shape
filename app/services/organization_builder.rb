class OrganizationBuilder
  attr_reader :organization, :errors

  def initialize(params, user)
    @organization = Organization.new(name: params[:name])
    @errors = @organization.errors
    @user = user
    @params = params
  end

  def save
    success = @organization.save
    set_primary_group_attrs
    add_role
    create_collections
    success
  end

  private

  def set_primary_group_attrs
    @organization.primary_group.attributes = @params
    @organization.primary_group.save
  end

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
