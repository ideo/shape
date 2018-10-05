require 'rails_helper'

describe Collection::TestDesign, type: :model do
  context 'associations' do
    it { should belong_to :test_collection }
    it { should have_many :question_items }
  end

  describe 'callbacks' do
    describe '#close_test' do
      let!(:test_collection) { create(:test_collection) }
      let!(:test_design) {
        test_collection.launch!(initiated_by: create(:user))
        # Need to call reload because test_collection relationship is stale
        test_collection.test_design.reload
      }

      it 'closes test collection if archived' do
        expect(test_collection.live?).to be true
        expect(test_design.reload.archived?).to be false
        test_design.archive!
        expect(test_design.reload.archived?).to be true
        expect(test_collection.reload.closed?).to be true
      end
    end
  end
end
