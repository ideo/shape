class Api::V1::CommentsController < Api::V1::BaseController
  deserializable_resource :comment, class: DeserializableComment, only: %i[create]
  load_and_authorize_resource :comment_thread, only: %i[index create]
  load_and_authorize_resource :comment, only: %i[destroy update]
  def index
    # mark comments as read
    @comment_thread.viewed_by!(current_user)
    paginated_comments = @comment_thread.comments.includes(:author).page(@page)
    render jsonapi: paginated_comments, include: [
      :author,
      :children => :author,
    ]
  end

  def create
    parent_id = comment_params[:parent_id] || nil
    parent = Comment.find parent_id unless parent_id.nil?
    @comment = CommentCreator.call(
      comment_thread: @comment_thread,
      message: comment_params[:message],
      draftjs_data: json_api_params[:data][:attributes][:draftjs_data],
      author: current_user,
      parent: parent,
    )
    if @comment
      render jsonapi: @comment
    else
      render jsonapi: @comment.errors
    end
  end

  def destroy
    if @comment.destroy
      head :no_content
    else
      render_api_errors @comment.errors
    end
  end

  def update
    success = CommentUpdater.call(
      comment: @comment,
      message: comment_params[:message],
      draftjs_data: json_api_params[:data][:attributes][:draftjs_data],
    )

    if success
      render jsonapi: @comment
    else
      render_api_errors @comment.errors
    end
  end

  private

  def comment_params
    params.require(:comment).permit(
      :message,
      :parent_id,
      :draftjs_data,
    )
  end
end
