class Api::V1::CommentThreadsController < Api::V1::BaseController
  before_action :load_comment_threads

  def index
    render jsonapi: @comment_threads, include: [:record, comments: [:author]]
  end

  def show
    render jsonapi: CommentThread.find(params[:id]), include: [:record, comments: [:author]]
  end

  private

  def load_comment_threads
    # get the 10 most recent; the front-end will re-sort :asc
    @comment_threads = CommentThread
      .order(updated_at: :desc)
      .limit(10)
      .includes(:record, comments: [:author])
  end
end
