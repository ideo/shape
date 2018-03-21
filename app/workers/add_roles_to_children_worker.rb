class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(role_ids, object_id, object_class)
    roles = Role.where(id: role_ids).to_a
    object = object_class.safe_constantize.find(object_id)

    Roles::AddToChildren.new(
      parent: object,
      new_roles: roles,
    ).call
  end
end
