require 'rails_helper'

RSpec.describe Item::QuestionItem, type: :model do
  context 'associations' do
    it { should have_many(:question_answers) }
  end

  context 'callbacks' do
    context 'after_create' do
      context 'with a customizable question' do
        let!(:question_item) { create(:question_item, question_type: :question_single_choice) }

        it 'should create 4 default question choices' do
          expect(question_item.question_choices.count).to be 4
        end
      end
    end
  end

  context 'with a launched test collection' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let(:test_collection) { create(:test_collection, :completed) }

    describe '#score' do
      before do
        # Stub out so it doesn't create all result collections
        allow(TestCollection::CreateResultsCollections).to receive(:call).and_return(
          double(success?: true),
        )
        allow(TestResultsCollection::CreateOrLinkAliasCollection).to receive(:call).and_return(
          double(success?: true),
        )
      end
      before { test_collection.launch! }
      let(:question_item) { test_collection.question_items.select(&:question_useful?).first }
      let(:test_audience) { create(:test_audience, test_collection: test_collection) }
      let!(:response) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }
      let!(:responses) do
        create_list(:survey_response,
                    4,
                    :fully_answered,
                    test_collection: test_collection,
                    test_audience: test_audience)
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

    context 'with roles on the test_collection' do
      let(:test_collection) { create(:test_collection, :completed, add_editors: [user], add_viewers: [user2]) }
      let(:question_card) do
        # use builder so that it actually handles the right permissions
        CollectionCardBuilder.call(
          params: {
            section_type: :ideas,
            item_attributes: {
              type: 'Item::QuestionItem',
              question_type: :question_useful,
            },
          },
          parent_collection: test_collection,
        )
      end
      let(:question_item) { question_card.item }

      it 'should defer to parent for resourceable capabilities' do
        expect(question_item.can_edit?(user)).to be true
        expect(question_item.can_edit?(user2)).to be false
        expect(question_item.can_view?(user2)).to be true
      end
    end
  end

  describe '#question_title_and_description' do
    context 'for category satisfaction question' do
      let(:question) do
        create(
          :question_item,
          question_type: :question_category_satisfaction,
          content: 'socks',
        )
      end

      it 'returns customized version' do
        expect(question.question_title_and_description).to eq(
          title: 'Category Satisfaction',
          description: 'How satisfied are you with your current socks?',
        )
      end
    end
  end
end
