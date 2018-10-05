class TextToQuillOps < SimpleService
  def initialize(text)
    @text = text
  end

  def call
    text_to_quill_ops
  end

  private

  def text_to_quill_ops
    @text.split(/\n+/).map(&:strip).map do |string|
      { insert: string }
    end
  end
end
