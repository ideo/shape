class TextItemHighlighter < SimpleService
  def initialize(item:, user:)
    @item = item
    @user = user
  end

  def call
    unless @item.can_edit?(@user)
      # this basically just validates that read-only users are only highlighting
      # and not changing the text content
      return false if @item.plain_content_changed?
    end

    @item.save
  end
end
