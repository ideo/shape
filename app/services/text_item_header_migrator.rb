class TextItemHeaderMigrator < SimpleService
  def initialize(item)
    @item = item
  end

  def call
    return unless @item.is_a?(Item::TextItem) && @item.ops.present?

    @item.ops = modify_quill_ops
    @item.update_columns(data_content: @item.data_content, updated_at: Time.current)
  end

  private

  def modify_quill_ops
    ops = []
    @item.ops.each_with_index do |op, i|
      op = Mashie.new(op)
      # this will be true on the newline, we actually want to apply size to the previous op
      header = op.attributes&.header
      # we are keeping h5 for the title style
      unless i.positive? && header.present? && header != 5
        ops[i] = op
        next
      end

      size = op.attributes.header == 1 ? 'huge' : 'large'
      previous_op = Mashie.new(@item.ops[i - 1])
      if previous_op.insert.include?("\n")
        # we have to split up the previous insert, move it to this op
        previous_op_split = previous_op.insert.split("\n")
        # pop the remainder off
        op.insert = "#{previous_op_split.pop}\n"
        previous_op.insert = "#{previous_op_split.join("\n")}\n"

        # modify current op (which would just be a "\n" for a quill header)
        op.attributes ||= {}
        op.attributes.size = size
        # add newline to the next op
        if @item.ops[i + 1].present?
          @item.ops[i + 1]['insert'].insert 0, "\n"
        else
          ops[i + 1] = { insert: "\n" }
        end
      else
        previous_op.attributes ||= {}
        previous_op.attributes.size = size
      end

      op.attributes.delete(:header)
      op.delete(:attributes) if op.attributes.empty?

      ops[i] = op
      ops[i - 1] = previous_op
    end

    ops
  end
end
