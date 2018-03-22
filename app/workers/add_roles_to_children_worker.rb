class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(new_role_ids, object_id, object_class)
    new_roles = Role.where(id: new_role_ids).to_a
    object = object_class.safe_constantize.find(object_id)

    Roles::AddToChildren.new(
      parent: object,
      new_roles: new_roles,
    ).call
  end
end
