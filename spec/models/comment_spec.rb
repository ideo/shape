require 'rails_helper'

RSpec.describe Comment, type: :model do
  context 'validations' do
    it { should validate_presence_of(:message) }
  end
  context 'associations' do
    it { should belong_to :comment_thread }
    it { should belong_to :author }
    describe 'replies_count' do
      let(:parent) { create(:comment) }
      let!(:replies) { create_list(:comment, 3, parent: parent) }
      it 'counts the number of replies' do
        expect(parent.replies_count).to eq(3)
      end
    end
  end
end
