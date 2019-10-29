class StripTags
  def initialize(string)
    # Make sure it is a string
    @string = string.to_s
  end

  def call
    strip_encoded_tags
    strip_html
    squeeze_whitespace
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

  def squeeze_whitespace
    @string = @string.squeeze(" \n").gsub(/\n(\s|\n)+/, "\n")
  end

  def sanitizer
    @sanitizer ||= Rails::Html::FullSanitizer.new
  end
end
