class RemoveRolesFromChildrenWorker
  include Sidekiq::Worker

  def perform(role_ids, object_id, object_class)
    roles = Role.where(id: role_ids).to_a
    object = object_class.safe_constantize.find(object_id)

    Roles::RemoveFromChildren.new(parent: object, roles: roles).call
  end
end
