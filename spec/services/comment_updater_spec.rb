require 'rails_helper'

RSpec.describe CommentUpdater, type: :service do
  let(:author) { create(:user) }
  let(:followers) { create_list(:user, 2) }
  let(:comment_thread) { create(:item_comment_thread, add_followers: followers) }
  let(:originally_mentioned_user) { create(:user) }
  let(:formerly_mentioned_user) { create(:user) }
  let(:newly_mentioned_user) { create(:user) }
  let(:originally_mentioned_group) { create(:group) }
  let(:formerly_mentioned_group) { create(:group) }
  let(:newly_mentioned_group) { create(:group) }

  let(:comment) do
    create(
      :comment,
      comment_thread: comment_thread,
      author: author,
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
                { 'id' => "#{originally_mentioned_user.id}__users",
                  'name' => originally_mentioned_user.name,
                  'handle' => originally_mentioned_user.handle } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '1' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{formerly_mentioned_user.id}__users",
                  'name' => formerly_mentioned_user.name,
                  'handle' => formerly_mentioned_user.handle } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '2' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{originally_mentioned_group.id}__groups", 'name' => 'Open IDEO', 'handle' => 'open-ideo' } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '3' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{formerly_mentioned_group.id}__groups", 'name' => 'Open IDEO', 'handle' => 'open-ideo' } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
          },
      },
    )
  end
  let(:message) { 'Updated' }
  let(:mentioned) { create(:user) }
  let(:mentioned_group) { create(:group) }
  let(:comment_updater) do
    CommentUpdater.new(
      comment: comment,
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
                { 'id' => "#{originally_mentioned_user.id}__users",
                  'name' => originally_mentioned_user.name,
                  'handle' => originally_mentioned_user.handle } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '1' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{newly_mentioned_user.id}__users",
                  'name' => newly_mentioned_user.name,
                  'handle' => newly_mentioned_user.handle } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '2' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{originally_mentioned_group.id}__groups", 'name' => 'Open IDEO', 'handle' => 'open-ideo' } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
            '3' =>
            { 'data' =>
              { 'mention' =>
                { 'id' => "#{newly_mentioned_group.id}__groups", 'name' => 'Open IDEO', 'handle' => 'open-ideo' } },
              'type' => 'mention',
              'mutability' => 'IMMUTABLE'},,
          },
      },
    )
  end

  describe '#call' do
    it 'should update the comment' do
      comment_updater.call
      expect(comment.message).to eq(message)
    end

    it 'should create an activity log' do
      allow(ActivityAndNotificationBuilder).to receive(:call)

      comment_updater.call

      expect(ActivityAndNotificationBuilder).to have_received(:call).once.with(
        actor: author,
        target: comment.comment_thread.record,
        action: :edited_comment,
        content: message,
      )
    end

    describe 'editing a comment with mentions' do
      it 'should only notify users and groups who are newly mentioned' do
        allow(ActivityAndNotificationBuilder).to receive(:call)

        comment_updater.call

        expect(ActivityAndNotificationBuilder).to have_received(:call).once.with(
          actor: author,
          target: comment.comment_thread.record,
          action: :mentioned,
          subject_user_ids: [newly_mentioned_user.id],
          subject_group_ids: [newly_mentioned_group.id],
          combine: true,
          content: message,
        )
      end
    end
  end
end
