class RestorePermission < SimpleService
  # NOTE: only used for user-initiated actions via the controller

  def initialize(object:,
                 restored_by: nil)
    @object = object
    @restored_by = restored_by
  end

  def call
    Roles::MergeToChild.call(parent: @object.parent, child: @object)
    @object.unmark_as_private!
    log_activity
    return unless @object.collection?

    @object.update(anyone_can_view: @object.parent.anyone_can_view)
    return unless @object.parent.anyone_can_view?

    Sharing::PropagateAnyoneCanView.call(collection: @object)
  end

  private

  def log_activity
    ActivityAndNotificationBuilder.call(
      actor: @restored_by,
      target: @object,
      action: :permissions_restored,
      subject_user_ids: [@restored_by.id],
      should_notify: false,
    )
  end
end
