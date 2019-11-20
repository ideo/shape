class MarkAsPrivate < SimpleService
  # NOTE: only used for user-initiated actions via the controller
  def initialize(object:,
                 marked_by: nil)
    @object = object
    @marked_by = marked_by
  end

  def call
    @object.mark_as_private!
    log_activity
  end

  private

  def log_activity
    ActivityAndNotificationBuilder.call(
      actor: @marked_by,
      target: @object,
      action: :made_private,
      subject_user_ids: [@marked_by.id],
      should_notify: false,
    )
  end
end
