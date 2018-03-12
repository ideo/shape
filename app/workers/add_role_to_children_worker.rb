class AddRoleToChildrenWorker
  include Sidekiq::Worker

  def perform(role_id, object_id, object_class)
    role = Role.find(role_id)
    object = object_class.safe_constantize.find(object_id)

    Roles::AddToChildren.new(object: object, role: role).call
  end
end
