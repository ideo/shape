class MassRemoveRolesWorker
  include Sidekiq::Worker

  def perform(object_id, object_class, role_name, user_ids, group_ids)
    object = object_class.safe_constantize.find(object_id)
    users = User.where(id: user_ids)
    groups = Group.where(id: group_ids)

    Roles::MassRemove.new(
      object: object,
      role_name: role_name,
      users: users,
      groups: groups,
      remove_from_children_sync: true,
    ).call
  end
end
