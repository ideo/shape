require 'rails_helper'

RSpec.describe CommentCreator, type: :service do
  describe '#call' do
    let(:comment_thread) { create(:item_comment_thread) }
    let(:message) { 'This is my message to you.' }
    let(:author) { create(:user) }
    let(:draftjs_data) do
      {
        'blocks' =>
         [{ 'key' => 'a0te4',
            'data' => {},
            'text' => 'This is my message to you.',
            'type' => 'unstyled',
            'depth' => 0 }],
      }
    end
    let(:comment_creator) do
      CommentCreator.new(
        comment_thread: comment_thread,
        message: message,
        draftjs_data: draftjs_data,
        author: author,
      )
    end

    context 'creates a comment and offloads a task to create activities and notifications' do
      it 'should create a comment' do
        comment = comment_creator.send(:create_comment)
        expect(comment).not_to be nil
      end

      it 'should create a task using CommentNotificationWorker' do
        expect(CommentNotificationWorker).to receive(:perform_async).with(anything, comment_thread.id, author.id)
        comment_creator.call
      end

      it 'should have comments' do
        comment = comment_creator.call
        expect(comment).not_to be nil
      end
    end
  end
end
