class QuillContentConverter < SimpleService
  def initialize(content)
    @content = content
    @quill_ops = []
    @current_string = ''
  end

  def text_to_quill_ops
    return {} unless @content.present?
    # preserve newlines but squeeze multiple newlines/spaces
    { ops: [{ insert: @content.squeeze("\n ").strip }] }
  end

  def html_to_quill_ops
    return {} unless @content.present?
    html = Nokogiri::HTML.fragment(@content)
    html.children.each do |element|
      process_element(element)
    end
    # Write to ops if we still have any current string,
    # or there was no content
    if @quill_ops.blank? || @current_string.present?
      @quill_ops.push(insert: @current_string)
    end
    { ops: @quill_ops }
  end

  def process_element(element)
    # Keep adding to current_string for regular paragraph text,
    # unless this is a header element

    element.children.each do |child_element|
      process_element(child_element)
    end

    # Concatenate all text in p tags together into a long string with text\ntext\n
    if @current_string.present? && !%w[text p].include?(element.name)
      write_current_string(element)
    end

    if element.name == 'text' &&
       (!element.parent || element.parent.name != 'a')
      process_text_tag(element)
    elsif %w[h1 h2 h3].include?(element.name)
      process_header(element)
    elsif element.name == 'a'
      process_link(element)
    elsif element.name == 'img'
      process_img(element)
    end
  end

  def write_current_string(element)
    # Need to add a newline if the next element is not a header
    @current_string += "\n" unless %w[h1 h2 h3 img].include?(element.name)
    @quill_ops.push(insert: @current_string)
    @current_string = ''
  end

  def process_header(element)
    header = element.name.gsub(/\D/, '').to_i
    @quill_ops.push(insert: @current_string) if @current_string.present?
    @quill_ops.push(insert: "\n", attributes: { header: header })
    @current_string = ''
  end

  def process_text_tag(element)
    text = element.text
    @current_string += @current_string.present? ? "\n#{text}" : text
  end

  def process_link(element)
    @quill_ops.push(
      insert: element.children[0].text,
      attributes: { link: element.attributes['href'].value },
    )
    @current_string = ''
  end

  def process_img(element)
    @quill_ops.push(
      insert: { image: element.attributes['src'].value },
    )
  end
end
