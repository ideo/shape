class Api::V1::CommentThreadsController < Api::V1::BaseController
  deserializable_resource :comment_thread, class: DeserializableCommentThread, only: %i[create]

  before_action :load_users_comment_threads, only: %i[index]
  def index
    render jsonapi: @comment_threads, include: thread_relations
  end

  load_and_authorize_resource only: %i[show]
  def show
    render jsonapi: @comment_thread, include: thread_relations
  end

  load_resource only: %i[view]
  def view
    # mark comments as read
    @comment_thread.viewed_by!(current_user)
    head :no_content
  end

  before_action :build_thread_and_authorize_record, only: %i[create]
  def create
    if @comment_thread.save
      AddCommentThreadFollowers.perform_async(@comment_thread.id)
      render jsonapi: @comment_thread, include: thread_relations
    else
      render_api_errors @collection.errors
    end
  end

  before_action :load_and_authorize_thread_by_record, only: %i[find_by_record]
  def find_by_record
    if @comment_thread
      render jsonapi: @comment_thread, include: thread_relations
    else
      render jsonapi: nil
    end
  end

  private

  def thread_relations
    [:record]
  end

  def comment_thread_params
    params.require(:comment_thread).permit(
      :record_id,
      :record_type,
    )
  end

  def load_and_authorize_thread_by_record
    @comment_thread = CommentThread.where(
      record_id: params[:record_id],
      record_type: params[:record_type],
    ).first
    return false unless @comment_thread.present?
    authorize! :read, @comment_thread.record
  end

  def build_thread_and_authorize_record
    @comment_thread = CommentThread.new(comment_thread_params)
    authorize! :read, @comment_thread.record
  end

  def load_users_comment_threads
    # get the 10 most recent; the front-end will re-sort :asc
    @comment_threads = current_user
                       .comment_threads
                       .where(organization_id: current_user.current_organization_id)
                       .order(updated_at: :desc)
                       .includes(:record, comments: [:author])
                       .page(params[:page])
                       .per(10)
  end
end
