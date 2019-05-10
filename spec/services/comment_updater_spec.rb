require 'rails_helper'

RSpec.describe CommentUpdater, type: :service do
  let(:author) { create(:user) }
  let(:followers) { create_list(:user, 2) }
  let(:comment_thread) { create(:item_comment_thread, add_followers: followers) }
  let(:comment) { create(:comment, comment_thread: comment_thread, author: author) }
  let(:message) { 'Updated' }
  let(:comment_updater) do
    CommentUpdater.new(
      comment: comment,
      message: message,
      draftjs_data: {}
    )
  end

  describe '#call' do
    context 'with results of CommentUpdater' do
      before do
        comment_updater.call
      end

      it 'should update the comment' do
        expect(comment.message).to eq(message)
      end

      it 'should create an activity log' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: author,
          target: comment.comment_thread.record,
          action: :edited_comment,
          content: message,
        )

        comment_updater.call
      end
    end
  end
end
