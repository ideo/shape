class InheritRolesFromParentWorker
  include Sidekiq::Worker

  def perform(object_id, object_class)
    object = object_class.safe_constantize.find(object_id)
    Roles::InheritFromParent.new(object).call
  end
end
