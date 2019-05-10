require 'rails_helper'

RSpec.describe CommentUpdater, type: :service do
  let(:author) { create(:user) }
  let(:comment_thread) { create(:item_comment_thread) }
  let(:comment) { create(:comment, comment_thread: comment_thread, author: author) }
  let(:comment_updater) do
    CommentUpdater.new(
      comment: comment,
      message: 'Updated',
      draftjs_data: {}
    )
  end

  describe '#call' do
    context 'with results of CommentUpdater' do
      before do
        comment_updater.call
      end

      it 'should update the comment' do
        expect(comment.message).to eq('Updated')
      end
    end
  end
end
