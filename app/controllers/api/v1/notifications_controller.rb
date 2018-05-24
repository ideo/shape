class Api::V1::NotificationsController < Api::V1::BaseController
  # TODO: authorize record

  def index
    render jsonapi: current_organization_notifications,
      include: [activity: %i[actor target subject_users subject_groups] ]
  end

  def show
    render jsonapi: @notification,
      include: [activity: %i[actor target subject_users subject_groups] ]
  end

  private

  def current_organization_notifications
    Notification.joins(:activity)
                .where(Activity.arel_table[:organization_id].eq(
                        current_user.current_organization_id))
                .where(user_id: current_user.id)
  end
end
