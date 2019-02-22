require 'rails_helper'

RSpec.describe QuillContentConverter, type: :service do
  let(:content) { nil }
  describe '#text_to_quill_ops' do
    let(:content) { 'Mary had a little lamb' }
    let(:text_to_quill_ops) do
      QuillContentConverter.new(content).text_to_quill_ops
    end

    it 'generates quill operations' do
      expect(text_to_quill_ops).to eq(
        ops: [{ insert: content }],
      )
    end
  end

  describe '#html_to_quill_ops' do
    let(:html_to_quill_ops) do
      QuillContentConverter.new(content).html_to_quill_ops
    end

    context 'with h1, h2 and p tags' do
      let!(:content) do
        '<h1>Amazing</h1><h2>Text</h2><p>Here</p>'
      end

      it 'generates quill operations' do
        expect(html_to_quill_ops).to eq(
          ops: [
            { insert: 'Amazing' },
            { insert: "\n", attributes: { header: 1 } },
            { insert: 'Text' },
            { insert: "\n", attributes: { header: 2 } },
            { insert: 'Here' },
          ],
        )
      end
    end

    context 'with no html in text' do
      let!(:content) { 'Amazing Text Here' }

      it 'generates quill operations' do
        expect(html_to_quill_ops).to eq(
          ops: [
            { insert: 'Amazing Text Here' },
          ],
        )
      end
    end
  end
end
