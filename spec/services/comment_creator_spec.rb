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
    let(:comment_attributes) do
      {
        comment_thread: comment_thread,
        message: message,
        draftjs_data: draftjs_data,
        author: author,
      }
    end
    let(:comment_creator) { CommentCreator.new(comment_attributes) }

    context 'creates a comment and offloads a task to create activities and notifications' do
      context 'when commenting on a collection/item' do
        it 'successfully creates a comment' do
          comment = comment_creator.call
          expect(comment).not_to be nil
        end

        it 'offloads a task to create activities and notifications' do
          expect(CommentNotificationWorker).to receive(:perform_async).with(anything, comment_thread.id, author.id)
          comment_creator.call
        end

        it 'associates the created comment with a comment thread and author (but not parent)' do
          comment = comment_creator.call
          expect(comment.author).to eq author
          expect(comment.comment_thread).to eq comment_thread
          expect(comment.parent).to be_nil
        end
      end

      context 'when replying to/commenting on a comment' do
        it 'creates a comment' do
          comment = comment_creator.send(:create_comment)
          expect(comment).not_to be nil
        end

        it 'creates a task using CommentNotificationWorker' do
          expect(CommentNotificationWorker).to receive(:perform_async).with(anything, comment_thread.id, author.id)
          comment_creator.call
        end

        it 'associates the created comment with a comment thread, author, and parent)' do
          comment = comment_creator.call
          expect(comment.author).to eq author
          expect(comment.comment_thread).to eq comment_thread

          reply_comment = CommentCreator.new(comment_attributes.merge(parent: comment)).call
          expect(reply_comment.parent).to eq comment
        end
      end
    end
  end
end
