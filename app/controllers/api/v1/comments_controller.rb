class Api::V1::CommentsController < Api::V1::BaseController
  load_and_authorize_resource :comment_thread, only: %i[index create]
  def index
    render jsonapi: @comment_thread.comments.includes(:author).page(params[:page]), include: [
      :author,
    ]
  end

  def create
    @comment = CommentCreator.call(
      comment_thread: @comment_thread,
      # NOTE: comment_params is coming through blank so we access this directly
      message: json_api_params[:data][:attributes][:message],
      draftjs_data: json_api_params[:data][:attributes][:draftjs_data],
      author: current_user,
    )
    if @comment
      ActivityAndNotificationBuilder.new(
        actor: current_user,
        target: @comment_thread.record,
        action: Activity.actions[:commented],
        subject_users: @comment_thread.users_threads.map(&:user),
        subject_groups: @comment_thread.groups_threads.map(&:group),
        combine: true,
        content: @comment.message,
      ).call
      head :no_content
    else
      render jsonapi: @comment.errors
    end
  end

  private

  def comment_params
    params.require(:comment).permit(
      :message,
      :draftjs_data,
    )
  end
end
