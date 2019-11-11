class RestorePermission < SimpleService
  # NOTE: only used for user-initiated actions via the controller

  def initialize(object:,
                 restored_by: nil)
    @object = object
    @restored_by = restored_by
  end

  def call
    Roles::MergeToChild.call(parent: @object.parent, child: @object)

    return unless @object.collection?

    unmarked = @object.unmark_as_private!
    log_activity if unmarked
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
