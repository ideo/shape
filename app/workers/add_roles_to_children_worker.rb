class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, role_name, object_id, object_class)
    users_to_add = User.where(id: user_ids).to_a
    groups_to_add = Group.where(id: group_ids).to_a
    object = object_class.safe_constantize.find(object_id)

    Roles::AddToChildren.new(
      users_to_add: users_to_add,
      groups_to_add: groups_to_add,
      role_name: role_name,
      parent: object,
    ).call
  end
end
