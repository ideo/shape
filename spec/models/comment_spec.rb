require 'rails_helper'

RSpec.describe Comment, type: :model do
  context 'validations' do
    it { should validate_presence_of(:message) }
  end
  context 'associations' do
    it { should belong_to :comment_thread }
    it { should belong_to :author }
    it { should belong_to :subject }

    describe 'replies_count' do
      let(:parent) { create(:comment) }
      let!(:replies) { create_list(:comment, 3, parent: parent) }
      it 'counts the number of replies' do
        expect(parent.replies_count).to eq(3)
      end
    end
  end

  describe '#text_highlight' do
    let!(:comment) { create(:comment) }
    let!(:text_item) do
      create(
        :text_item,
        data_content: {
          ops: [
            { insert: 'beginning\n' },
            { insert: 'hello\n', attributes: { commentHighlight: comment.id } },
            { insert: 'nextline words', attributes: { commentHighlight: comment.id } },
          ],
        },
      )
    end

    context 'with a text item subject and persisted highlight' do
      before do
        comment.update(subject: text_item)
      end

      it 'should extract text from the comment subject' do
        expect(comment.text_highlight).to eq 'hello nextline words'
      end
    end

    context 'with no subject' do
      it 'should return nil' do
        expect(comment.text_highlight).to be nil
      end
    end
  end
end
