require 'rails_helper'

RSpec.describe CommentCreator, type: :service do
  let(:followers) { create_list(:user, 2) }
  let(:comment_thread) { create(:item_comment_thread, add_followers: followers) }
  let(:message) { 'This is my message to you.' }
  let(:author) { create(:user) }
  let(:mentioned) { create(:user) }
  let(:mentioned_group) { create(:group) }
  let(:comment) { comment_thread.comments.first }
  let(:comment_creator) do
    CommentCreator.new(
      comment_thread: comment_thread,
      author: author,
      message: message,
      draftjs_data: {
        'blocks' =>
         [{ 'key' => 'a0te4',
            'data' => {},
            'text' => 'hi @group and @person how r u doing?',
            'type' => 'unstyled',
            'depth' => 0 }],
        'entityMap' =>
          {
            '0' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{mentioned_group.id}__groups", 'name' => 'Open IDEO', 'handle' => 'open-ideo' } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE' },
            '1' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{mentioned.id}__users",
                  'name' => mentioned.name,
                  'handle' => mentioned.handle } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE' },
          },
      },
    )
  end

  describe '#call' do
    context 'with results of CommentCreator' do
      before do
        comment_creator.call
      end

      it 'should create a comment' do
        expect(comment_thread.comments.count).to be 1
        expect(comment.persisted?).to be true
      end

      it 'should add user as a follower' do
        expect(author.comment_threads).to include(comment_thread)
      end

      it 'should add all mentioned users as followers' do
        expect(mentioned.comment_threads).to include(comment_thread)
      end

      it 'should add all mentioned groups as followers' do
        expect(mentioned_group.groups_threads.pluck(:comment_thread_id)).to include(comment_thread.id)
      end
    end

    context 'with notifications' do
      it 'should send comment notifications to all followers' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: author,
          target: comment_thread.record,
          action: :mentioned,
          subject_user_ids: [mentioned.id],
          subject_group_ids: [mentioned_group.id],
          combine: true,
          content: message,
        )

        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: author,
          target: comment_thread.record,
          action: :commented,
          subject_user_ids: (followers.pluck(:id) + [author.id]),
          subject_group_ids: [],
          omit_user_ids: [mentioned.id],
          omit_group_ids: [mentioned_group.id],
          combine: true,
          content: message,
        )

        comment_creator.call
      end
    end
  end
end
