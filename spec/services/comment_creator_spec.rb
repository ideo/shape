require 'rails_helper'

RSpec.describe CommentCreator, type: :service do
  let(:comment_thread) { create(:item_comment_thread) }
  let(:message) { 'This is my message to you.' }
  let(:author) { create(:user) }
  let(:comment) { comment_thread.comments.first }

  before do
    CommentCreator.call(
      comment_thread: comment_thread,
      author: author,
      message: message
    )
  end

  describe '#call' do
    it 'should create a comment' do
      expect(comment_thread.comments.count).to be 1
      expect(comment.persisted?).to be true
    end

    it 'should add user as a follower' do
      expect(author.comment_threads).to include(comment_thread)
    end
  end
end
