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

  context 'with a launched test collection' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let(:test_collection) { create(:test_collection, :completed) }

    describe '#score' do
      before { test_collection.launch! }
      let(:question_item) { test_collection.question_items.select(&:question_useful?).first }
      let!(:response) { create(:survey_response, test_collection: test_collection) }
      let!(:responses) do
        create_list(:survey_response,
                    4,
                    :fully_answered,
                    test_collection: test_collection)
      end
      let!(:question_answers) { question_item.question_answers }
      before do
        question_answers[0].update(answer_number: 1)
        question_answers[1].update(answer_number: 2)
        question_answers[2].update(answer_number: 2)
        question_answers[3].update(answer_number: 4)
        question_item.update(question_type: :question_useful)
      end

      it 'should calculate the score based on answer_numbers' do
        # should be 0 + 1 + 1 + 3 / 12 = 42%
        expect(question_item.score).to eq 42
      end
    end

    context 'and a useful question' do
      let(:test_design) do
        create(:test_design, test_collection: test_collection, add_editors: [user], add_viewers: [user2])
      end
      let(:question_card) do
        # use builder so that it actually handles the right permissions
        builder = CollectionCardBuilder.new(
          params: {
            item_attributes: {
              type: 'Item::QuestionItem',
              question_type: :question_useful,
            },
          },
          parent_collection: test_design,
        )
        builder.create
        builder.collection_card
      end
      let(:question_item) { question_card.item }

      it 'should defer to parent for resourceable capabilities' do
        expect(question_item.can_edit?(user)).to be true
        expect(question_item.can_edit?(user2)).to be false
        expect(question_item.can_view?(user2)).to be true
      end
    end
  end
end
