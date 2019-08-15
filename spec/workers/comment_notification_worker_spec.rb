require 'rails_helper'

RSpec.describe CommentNotificationWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let!(:comment_thread) { create(:item_comment_thread) }
    let!(:comment) { create(:comment, comment_thread: comment_thread, author: user) }

    before do
      allow(Comment).to receive(:find).and_return(comment)
      allow(CommentThread).to receive(:find).and_return(comment_thread)
    end

    it 'creates comments and notifications' do
      CommentNotificationWorker.new.perform(comment.id, comment_thread.id, user.id)
      # add other tests here
    end
  end
end
