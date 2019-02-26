class QuillContentConverter < SimpleService
  def initialize(content)
    @content = content
  end

  def text_to_quill_ops
    return unless @content.present?
    # preserve newlines but squeeze multiple newlines/spaces
    { ops: [{ insert: @content.squeeze("\n ").strip }] }
  end

  def html_to_quill_ops
    return unless @content.present?
    quill_ops = []
    html = Nokogiri::HTML.fragment(@content)
    current_string = ''
    html.children.each do |element|
      # There are no children if the element is not an html element
      t = element.children.present? ? element.children[0].text : element.text
      current_string += current_string.present? ? "\n#{t}" : t
      # Keep adding to current_string for regular paragraph text,
      # unless this is a header element
      next unless %w[h1 h2 h3].include?(element.name)
      header = element.name.gsub(/\D/, '').to_i
      quill_ops.push(insert: current_string)
      quill_ops.push(insert: "\n", attributes: { header: header })
      current_string = ''
    end
    # Write to ops if we still have any current string,
    # or there was no content
    if quill_ops.blank? || current_string.present?
      quill_ops.push(insert: current_string)
    end
    { ops: quill_ops }
  end
end
