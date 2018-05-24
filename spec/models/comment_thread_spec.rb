require 'rails_helper'

RSpec.describe CommentThread, type: :model do
  context 'associations' do
    it { should belong_to :record }
    it { should have_many :comments }
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
end
