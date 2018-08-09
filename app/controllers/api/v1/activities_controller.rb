class Api::V1::ActivitiesController < Api::V1::BaseController
  deserializable_resource :activity, class: DeserializableActivity, only: :create

  load_resource :activity, only: :create
  def create
    if activity_params[:target_type] == 'collections'
      target = Collection.find(activity_params[:target_id])
    else
      target = Item.find(activity_params[:target_id])
    end
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: target,
      action: activity_params[:action],
      subject_user_ids: target.editors[:users].pluck(:id),
      subject_group_ids: target.editors[:groups].pluck(:id),
    )
    head :no_content
  end

  def activity_params
    params.require(:activity).permit(
      :action,
      :target_type,
      :target_id,
    )
  end
end
