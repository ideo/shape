require 'rails_helper'

describe Collection::TestDesign, type: :model do
  context 'associations' do
    it { should belong_to :test_collection }
    it { should have_many :question_items }
  end

  context 'with open response questions' do
    let!(:test_collection) { create(:test_collection, :open_response_questions) }
    let(:test_design) do
      # Simulate launching a test
      test_collection.launch_test!(initiated_by: create(:user))
      test_collection.test_design
    end

    it 'creates a TestOpenResponse collection for each item' do
      expect {
        test_design
      }.to change(
        Collection::TestOpenResponses, :count
      ).by(test_collection.question_items.size)

      expect(
        test_design
          .question_items
          .all?(&:test_open_responses_collection),
      ).to be true
    end
  end
end
