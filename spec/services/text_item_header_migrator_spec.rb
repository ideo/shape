require 'rails_helper'

RSpec.describe TextItemHeaderMigrator, type: :service do
  let(:text_item) do
    create(
      :text_item,
      data_content: {
        ops: [
          { insert: '1. Storyboard the current experience' },
          { insert: "\n", attributes: { header: 1 } },
          { insert: "Sketch and describe the experience.\nHere lies an H2" },
          { insert: "\n", attributes: { header: 2 } },
          { insert: "Some body text\nA big H5" },
          { insert: "\n", attributes: { header: 5 } },
          { insert: "\n" },
        ],
      },
    )
  end
  subject do
    TextItemHeaderMigrator.new(text_item)
  end

  describe '#call' do
    it 'should migrate H1 and H2 headers into inline "huge/large" size, while preserving H5' do
      subject.call
      expect(text_item.ops).to eq [
        { insert: '1. Storyboard the current experience', attributes: { size: 'huge' } },
        { insert: "\n" },
        { insert: "Sketch and describe the experience.\n" },
        { insert: "Here lies an H2\n", attributes: { size: 'large' } },
        { insert: "Some body text\nA big H5" },
        { insert: "\n", attributes: { header: 5 } },
        { insert: "\n" },
      ].as_json
    end
  end
end
