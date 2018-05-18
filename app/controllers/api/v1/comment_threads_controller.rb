class Api::V1::CommentThreadsController < Api::V1::BaseController
  # TODO: authorize record
  deserializable_resource :comment_thread, class: DeserializableCommentThread, only: %i[create]
  before_action :load_comment_threads, only: %i[index]

  def index
    render jsonapi: @comment_threads, include: thread_relations
  end

  def show
    render jsonapi: CommentThread.find(params[:id]), include: thread_relations
  end

  def create
    @comment_thread = CommentThread.create(comment_thread_params)
    if @comment_thread
      render jsonapi: @comment_thread.reload, include: thread_relations
    else
      render_api_errors @collection.errors
    end
  end

  def find_by_record
    @comment_thread = CommentThread.where(
      record_id: params[:record_id],
      record_type: params[:record_type],
    ).first
    if @comment_thread
      render jsonapi: @comment_thread, include: thread_relations
    else
      render jsonapi: nil
    end
  end

  private

  def thread_relations
    [:record, comments: [:author]]
  end

  def comment_thread_params
    params.require(:comment_thread).permit(
      :record_id,
      :record_type,
    )
  end

  def load_comment_threads
    # get the 10 most recent; the front-end will re-sort :asc
    @comment_threads = CommentThread
      .order(updated_at: :desc)
      .limit(10)
      .includes(:record, comments: [:author])
  end
end
