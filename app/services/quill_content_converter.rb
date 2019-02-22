class QuillContentConverter < SimpleService
  def initialize(content)
    @content = content
  end

  def text_to_quill_ops
    # preserve newlines but squeeze multiple newlines/spaces
    { ops: [{ insert: @content.squeeze("\n ").strip }] }
  end

  def html_to_quill_ops
    quill_ops = []
    html = Nokogiri::HTML.fragment(@content)
    current_string = ''
    html.children.each do |element|
      t = element.children[0].text
      current_string += current_string.present? ? "\n#{t}" : t
      next unless %w[h1 h2 h3].include? element.name
      header = element.name.gsub(/\D/, '').to_i
      quill_ops.push(insert: current_string)
      quill_ops.push(insert: "\n", attributes: { header: header })
      current_string = ''
    end
    if current_string.blank?
      quill_ops.push(insert: current_string)
    end
    { ops: quill_ops }
  end
end
