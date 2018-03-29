class StripTags
  def initialize(string)
    @string = string
  end

  def call
    strip_encoded_tags
    strip_html
    strip_whitespace
  end

  private

  def strip_encoded_tags
    # Strips any tags that got encoded, e.g. &lt;
    @string.gsub!(/&lt;[^&]*&gt;/, '')
  end

  def strip_html
    # Strips all html elements, e.g. <a href="...">link</a>
    @string = sanitizer.sanitize(@string)
  end

  def strip_whitespace
    @string = @string.squeeze(' ').strip
  end

  def sanitizer
    @sanitizer ||= Rails::Html::FullSanitizer.new
  end
end
