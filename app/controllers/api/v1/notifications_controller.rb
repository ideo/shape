class Api::V1::NotificationsController < Api::V1::BaseController
  deserializable_resource :notification, class: DeserializableNotification, only: %i[update]
  # TODO: authorize record

  def index
    render jsonapi: current_organization_notifications, include: [
      combined_activities: %i[actor],
      activity: %i[actor subject_users subject_groups target],
    ]
  end

  def show
    render jsonapi: @notification, include: [
      combined_activities: %i[actor],
      activity: %i[actor target subject_users subject_groups],
    ]
  end

  def update
    notification = Notification.find(params[:id])
    notification.attributes = notification_params
    if notification.save
      notification.store_in_firestore
      head :no_content
    else
      render_api_errors notification.errors
    end
  end

  private

  def notification_params
    params.require(:notification).permit(
      :read,
    )
  end

  def current_organization_notifications
    Notification.joins(:activity)
                .where(Activity.arel_table[:organization_id]
                      .eq(current_user.current_organization_id))
                .where(user_id: current_user.id)
  end
end
