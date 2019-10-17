class CommentResolver < SimpleService
  def initialize(comment:, user:, status:)
    @comment = comment
    @user = user
    @status = status
  end

  def call
    @comment.status = @status
    if @comment.subject.present? && @comment.subject.is_a?(Item::TextItem)
      @comment.subject.quill_data = { ops: new_highlight_ops }
      @comment.subject.save
    end
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
    Mashie.new(subject.data_content).ops.map do |op|
      if resolving?
        comment_id = op.attributes&.commentHighlight
      elsif reopening?
        comment_id = op.attributes&.commentHighlightResolved
      end
      if comment_id && comment_id.to_s == @comment.id.to_s
        if resolving?
          op.attributes.delete 'commentHighlight'
          op.attributes.commentHighlightResolved = comment_id
        elsif reopening?
          op.attributes.commentHighlight = comment_id
          op.attributes.delete 'commentHighlightResolved'
        end
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

  def resolving?
    @status.to_sym == :resolved
  end

  def reopening?
    @status.to_sym == :reopened
  end
end
