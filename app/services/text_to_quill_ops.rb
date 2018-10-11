class TextToQuillOps < SimpleService
  def initialize(text)
    @text = text
  end

  def call
    text_to_quill_ops
  end

  private

  def text_to_quill_ops
    # preserve newlines but squeeze multiple newlines/spaces
    [{ insert: @text.squeeze("\n ").strip }]
  end
end
