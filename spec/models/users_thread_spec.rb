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
end
