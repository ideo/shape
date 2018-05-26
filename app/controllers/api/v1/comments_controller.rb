class Api::V1::CommentsController < Api::V1::BaseController
  def create
    @comment_thread = CommentThread.find(params[:comment_thread_id])
    @comment = @comment_thread.comments.create(
      message: json_api_params['message'],
      author_id: current_user.id,
    )
    if @comment.save
      # TODO: update subjects when we have user threads merged in.
      ActivityAndNotificationBuilder.new(
        actor: current_user,
        target: @comment_thead,
        action: Activity.actions[:commented],
        subject_users: [],
        subject_groups: [],
      ).call
      # render the whole thread so that the front-end can be updated
      render jsonapi: @comment_thread, include: [comments: [:author]]
    else
      render jsonapi: @comment.errors
    end
  end

  private

  def comment_params
    params.require(:comment).permit(
      :message,
    )
  end
end
