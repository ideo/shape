class AddRolesToChildrenWorker
  include Sidekiq::Worker

  def perform(role_ids, object_id, object_class, ignore_inheritance_rules = false)
    roles = Role.where(id: role_ids).to_a
    object = object_class.safe_constantize.find(object_id)

    Roles::AddToChildren.new(
      object: object,
      roles: roles,
      ignore_inheritance_rules: ignore_inheritance_rules,
    ).call
  end
end
