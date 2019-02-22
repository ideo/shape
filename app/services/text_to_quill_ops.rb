class TextToQuillOps < SimpleService
  def initialize(text)
    @text = text
  end

  def call
    text_to_quill_ops
  end

  def html_to_quill_ops
    quill_ops = []
    html = Nokogiri::HTML.fragment(@text)
    html.children.each do |element|
      quill_ops.push(insert: element.children[0].text)
      if element.name != 'p'
        quill_ops.push(insert: '↵', attributes: [{ header: element.name }])
      end
    end
    quill_ops
  end

  private

  def text_to_quill_ops
    # preserve newlines but squeeze multiple newlines/spaces
    [{ insert: @text.squeeze("\n ").strip }]
  end
end
