require 'rails_helper'

RSpec.describe Item::TextItem, type: :model do
  context 'instance methods' do
    let(:data_content) do
      {
        ops: [
          { insert: "How might we do &lt;b&gt;X&lt;/b&gt;\n\n" },
          { insert: "\n", attributes: { header: 3 } },
          { insert: "\What if we were to do that thing?\n" },
        ],
      }
    end
    let(:text_item) { create(:text_item, name: nil, content: '<p>How might we do <b>X</b></p>', data_content: data_content) }

    describe '#plain_content' do
      it 'should create plaintext content based on data_content' do
        expect(text_item.plain_content).to eq 'How might we do X | What if we were to do that thing?'
      end
    end

    describe '#generate_name' do
      it 'should create an item name by stripping tags and truncating the content' do
        expect(text_item.name).to eq 'How might we do X'
      end
    end
  end
end
