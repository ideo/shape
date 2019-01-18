require 'rails_helper'

RSpec.describe CommentThread, type: :model do
  context 'associations' do
    it { should belong_to :record }
    it { should have_many :comments }
  end

  describe '#unread_comments_for' do
    let(:user) { create(:user) }
    let(:comment_thread) { create(:collection_comment_thread, num_comments: 2, add_followers: [user]) }

    before do
      comment_thread.users_threads.first.update(last_viewed_at: 1.day.ago)
    end

    context 'with unread comments' do
      it 'should only get the unread comments for the user' do
        expect(comment_thread.unread_comments_for(user).count).to eq 2
      end
    end

    context 'when recently viewed' do
      before do
        comment_thread.viewed_by!(user)
      end

      it 'should not have any unread comments for the user' do
        expect(comment_thread.unread_comments_for(user).count).to eq 0
      end
    end
  end

  describe '#add_user_follower!' do
    let(:comment_thread) { create(:collection_comment_thread) }
    let(:user) { create(:user) }

    it 'should create a user thread for the given user' do
      expect {
        comment_thread.add_user_follower!(user.id)
      }.to change(comment_thread.users_threads, :count).by(1)
      expect(user.comment_threads).to include(comment_thread)
    end
  end

  describe '#add_group_follower!' do
    let(:comment_thread) { create(:collection_comment_thread) }
    let(:user) { create(:user) }
    let(:group) { create(:group, add_members: [user]) }

    it 'should create a group thread and user thread the group\'s users' do
      expect {
        comment_thread.add_group_follower!(group.id)
      }.to change(comment_thread.groups_threads, :count).by(1)
      expect(user.comment_threads).to include(comment_thread)
    end
  end

  describe '#update_firestore_users_threads' do
    let(:comment_thread) { create(:collection_comment_thread) }
    let(:users_thread) { create(:users_thread, comment_thread: comment_thread) }

    it 'should update the users_threads on update' do
      expect(FirestoreBatchWriter).to receive(:perform_in).with(
        3.seconds,
        [users_thread.batch_job_identifier],
      )
      comment_thread.update(updated_at: Time.now)
    end
  end
end
