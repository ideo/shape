class TextItemHighlightUpdater < SimpleService
  def initialize(comment, status)
    @comment = comment
    @status = status
  end

  def call
    if @comment.subject.present? && @comment.subject.is_a?(Item::TextItem)
      @comment.subject.quill_data = { ops: new_highlight_ops }
      @comment.subject.save
      return true
    end
    false
  end

  private

  def new_highlight_ops
    subject = @comment.subject

    return scrub_highlight_ops(subject) if deleting?

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

  def resolving?
    @status.to_sym == :resolved
  end

  def reopening?
    @status.to_sym == :reopened
  end

  def deleting?
    # not an actual comment status, used to scrub after comment destroy
    @status.nil?
  end

  def scrub_highlight_ops(subject)
    Mashie.new(subject.data_content).ops.each do |op|
      next unless op&.attributes

      comment_id = op.attributes&.commentHighlightResolved || op.attributes&.commentHighlight
      next unless comment_id && comment_id.to_s == @comment.id.to_s

      op.attributes = op.attributes.except!(:commentHighlight, :commentHighlightResolved)
    end
  end
end
