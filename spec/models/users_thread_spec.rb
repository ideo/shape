require 'rails_helper'

describe UsersThread, type: :model do
  context 'associations' do
    it { should belong_to :user }
    it { should belong_to :comment_thread }
  end

  describe '#updated_at' do
    let(:comment_thread) { create(:item_comment_thread) }
    let(:users_thread) { create(:users_thread, comment_thread: comment_thread) }

    it 'should delegate updated_at to comment_thread' do
      expect(users_thread.updated_at).to eq(comment_thread.updated_at)
    end
  end

  describe 'before_create' do
    context 'when a parent has been unsubscribed' do
      let!(:user) { create(:user) }
      let!(:parent_record) { create(:collection) }
      let(:record) { create(:collection, parent_collection: parent_record) }
      let!(:parent_comment_thread) { create(:collection_comment_thread, record: parent_record) }
      let!(:parent_users_thread) { create(:users_thread, comment_thread: parent_comment_thread, user: user, subscribed: false) }

      let!(:comment_thread) { create(:collection_comment_thread, record: record) }
      let!(:users_thread) { create(:users_thread, comment_thread: comment_thread, user: user) }

      it 'should unsubscribe the new users thread' do
        expect(users_thread.subscribed).to be false
      end
    end
  end
end
