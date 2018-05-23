class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, current_user, role_name, object_id, object_class)
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    object = object_class.safe_constantize.find(object_id)
    # no need to proceed unless this object has children
    return unless object.children.any?
    Roles::AddToChildren.new(
      role_name: role_name,
      parent: object,
      current_user: current_user,
      users_to_add: users_to_add,
      groups_to_add: groups_to_add,
    ).call
  end
end
