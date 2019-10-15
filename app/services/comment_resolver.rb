class CommentResolver < SimpleService
  def initialize(comment:, user:, status:)
    @comment = comment
    @user = user
    @status = status
  end

  def call
    @comment.status = @status
    @comment.subject.update(data_content: { ops: new_highlight_ops }) if @comment.subject.present? && @comment.subject.is_a?(Item::TextItem)
    if @comment.save
      @comment.store_in_firestore
      create_resolved_activity
      return true
    end
    false
  end

  private

  def new_highlight_ops
    subject = @comment.subject
    Hashie::Mash.new(subject.data_content).ops.map do |op|
      comment_id = op.attributes&.commentHighlight
      comment_highlight_tag = "#{comment_id}-resolved"
      if comment_id && comment_id.to_s == @comment.id.to_s && @status.to_sym == :resolved
        op.attributes.commentHighlight = comment_highlight_tag
      elsif comment_id && comment_id.to_s != @comment.id.to_s && @status.to_sym != :resolved
        op.attributes.commentHighlight = @comment.id.to_s
      end
      op
    end
  end

  def create_resolved_activity
    ActivityAndNotificationBuilder.call(
      actor: @user,
      target: @comment.comment_thread.record,
      action: :resolved_comment,
      content: @comment.message,
    )
  end
end
