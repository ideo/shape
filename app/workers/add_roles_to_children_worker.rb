class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(
    user_id,
    user_ids,
    group_ids,
    role_name,
    object_id,
    object_class,
    previous_anchor_id,
    method = 'add'
  )
    user = User.where(id: user_id).first
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    object = object_class.safe_constantize.find(object_id)
    # no need to proceed unless this object has children
    return unless object.children.any?
    Roles::AddToChildren.new(
      user: user,
      role_name: role_name,
      parent: object,
      users_to_add: users_to_add,
      groups_to_add: groups_to_add,
      previous_anchor_id: previous_anchor_id,
      method: method,
    ).call
  end
end
