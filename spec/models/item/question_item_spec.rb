require 'rails_helper'

RSpec.describe Item::QuestionItem, type: :model do
  context 'associations' do
    it { should have_many(:question_answers) }
  end

  describe 'callbacks' do
    describe '#notify_test_design_of_creation' do
      it 'does not notify if test design does not exist' do
        allow_any_instance_of(Collection::TestDesign).to receive(:question_item_created)
        expect_any_instance_of(Collection::TestDesign).not_to receive(:question_item_created)
        create(:question_item)
      end

      context 'with test design' do
        let!(:survey_response) { create(:survey_response) }
        let!(:test_design) do
          create(:test_design, test_collection: survey_response.test_collection)
        end

        it 'does notify of question creation' do
          # Stub out parent so it's simpler to setup test
          allow(test_design).to receive(:question_item_created)
          allow_any_instance_of(Item::QuestionItem).to receive(:parent).and_return(test_design)
          question_item = create(:question_item)
          expect(
            test_design
          ).to have_received(:question_item_created).with(question_item)
        end
      end
    end
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
