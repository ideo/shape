class Api::V1::CommentsController < Api::V1::BaseController
  load_and_authorize_resource :comment_thread, only: %i[index create]
  def index
    @comment_thread.viewed_by!(current_user)
    render jsonapi: @comment_thread.comments.page(params[:page]), include: [:author]
  end

  def create
    @comment = CommentCreator.call(
      comment_thread: @comment_thread,
      message: json_api_params['message'],
      author: current_user,
    )
    if @comment
      render jsonapi: @comment, include: [:author]
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
