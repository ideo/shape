class RemoveRolesFromChildrenWorker
  include Sidekiq::Worker

  def perform(object_id, object_class, role_name, user_ids, group_ids)
    object = object_class.safe_constantize.find(object_id)
    users = User.where(id: user_ids).to_a
    groups = Group.where(id: group_ids).to_a

    Roles::RemoveFromChildren.new(
      parent: object,
      role_name: role_name,
      users: users,
      groups: groups,
    ).call
  end
end
