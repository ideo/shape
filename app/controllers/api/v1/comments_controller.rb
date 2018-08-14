class Api::V1::CommentsController < Api::V1::BaseController
  load_and_authorize_resource :comment_thread, only: %i[index create]
  def index
    # mark comments as read
    @comment_thread.viewed_by!(current_user)
    paginated_comments = @comment_thread.comments.includes(:author).page(params[:page])
    render jsonapi: paginated_comments, include: [
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
