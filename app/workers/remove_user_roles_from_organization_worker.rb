class RemoveUserRolesFromOrganizationWorker
  include Sidekiq::Worker

  def perform(organization_id, user_id)
    @organization_id = organization_id
    @user = User.find(user_id)

    role_ids = collection_role_ids
    role_ids += group_role_ids
    role_ids += item_role_ids

    UsersRole.where(role_id: role_ids, user_id: @user.id).destroy_all
  end

  private

  def collection_role_ids
    @user.collections
         .where(organization_id: @organization_id)
         .select(:role_id)
         .map(&:role_id)
  end

  def group_role_ids
    @user.groups
         .where(organization_id: @organization_id)
         .select(:role_id)
         .map(&:role_id)
  end

  def item_role_ids
    Item.joins(parent_collection_card: :parent, roles: :users_roles)
        .where('collections.organization_id' => @organization_id, 'users_roles.user_id' => @user.id)
        .select(:role_id)
        .map(&:role_id)
  end
end
