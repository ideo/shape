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

    context 'with mixed header and p tags' do
      let!(:content) do
        '<h1>Title</h1><p>some other</p><p>paragraphs</p><h3>Subtitle</h3><p>and a conclusion</p>'
      end

      it 'generates quill operations' do
        expect(html_to_quill_ops).to eq(
          ops: [
            { insert: 'Title' },
            { insert: "\n", attributes: { header: 1 } },
            { insert: "some other\nparagraphs\nSubtitle" },
            { insert: "\n", attributes: { header: 3 } },
            { insert: 'and a conclusion' },
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
