require 'rails_helper'

RSpec.describe Item::QuestionItem, type: :model do
  context 'associations' do
    it { should have_many(:question_answers) }
  end

  context 'role access within a test collection' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let(:test_collection) { create(:test_collection) }
    let(:test_design) do
      create(:test_design, test_collection: test_collection, add_editors: [user], add_viewers: [user2])
    end
    let(:question_card) { create(:collection_card_question, parent: test_design) }
    let(:question_item) { question_card.item }

    it 'should defer to parent for resourceable capabilities' do
      expect(question_item.can_edit?(user)).to be true
      expect(question_item.can_edit?(user2)).to be false
      expect(question_item.can_view?(user2)).to be true
    end
  end
end
