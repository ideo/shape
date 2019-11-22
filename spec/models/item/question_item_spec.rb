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

  context 'boolean matchers' do
    let!(:question_customizable) { create(:question_item, question_type: :question_single_choice) }
    let!(:question_scale) { create(:question_item, question_type: :question_excitement) }
    let!(:question_description) { create(:question_item, question_type: :question_description) }
    let!(:file_item) { create(:file_item) }

    describe '#question_choices_customizable?' do
      it 'should return true for single/multi choice' do
        expect(question_customizable.question_choices_customizable?).to be true
        expect(question_scale.question_choices_customizable?).to be false
        expect(question_description.question_choices_customizable?).to be false
      end
    end

    describe '#question_scale?' do
      it 'should return true for scaled question' do
        expect(question_customizable.scale_question?).to be false
        expect(question_scale.scale_question?).to be true
        expect(question_description.scale_question?).to be false
        expect(file_item.scale_question?).to be false
      end
    end

    describe '#graphable_question?' do
      it 'should return true for both customizable and scale' do
        expect(question_customizable.graphable_question?).to be true
        expect(question_scale.graphable_question?).to be true
        expect(question_description.graphable_question?).to be false
        expect(file_item.graphable_question?).to be false
      end
    end
  end

  context 'validations' do
    context 'adding more than 6 ideas to a test' do
      let(:idea_collection) { create(:collection) }
      let(:collection_card) do
        create(:collection_card,
               parent: idea_collection,
               section_type: :ideas)
      end

      before do
        7.times do
          create(:question_item,
                 question_type: :question_idea,
                 parent_collection: idea_collection)
        end
      end

      it 'should fail validation' do
        idea_item = Item::QuestionItem.create(
          parent_collection_card: collection_card,
          question_type: :question_idea,
        )
        expect(idea_item.valid?).to be false
        expect(idea_item.errors.messages[:base]).to eq ['too many ideas']
      end
    end
  end

  context 'with a launched test collection' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let(:test_collection) { create(:test_collection, :launched) }

    describe '#score' do
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

    context 'with audiences on the test collection' do
      let(:audience) { create(:audience, min_price_per_response: 4.00) }
      let!(:test_audience) { create(:test_audience, test_collection: test_collection, audience: audience) }

      it 'updates price per response when question is created' do
        num_questions = test_collection.paid_question_items.size
        expect(test_audience.price_per_response).to eq(audience.price_per_response(num_questions))
        create(:question_item, question_type: :question_useful, parent_collection: test_collection)
        expect(test_collection.reload.paid_question_items.size).to eq(num_questions + 1)
        expect(test_audience.reload.price_per_response).to eq(audience.price_per_response(num_questions))
      end

      it 'updates price per response when question is archived' do
        num_questions = test_collection.paid_question_items.size
        question_item = test_collection.question_items.select(&:question_useful?).first
        expect(test_audience.price_per_response).to eq(audience.price_per_response(num_questions))
        question_item.archive!
        expect(test_collection.reload.paid_question_items.size).to eq(num_questions - 1)
        expect(test_audience.reload.price_per_response).to eq(audience.price_per_response(num_questions - 1))
      end
    end
  end

  describe '#question_description' do
    context 'for category satisfaction question' do
      let(:question) do
        create(
          :question_item,
          question_type: :question_category_satisfaction,
          content: 'socks',
        )
      end

      it 'returns customized version' do
        expect(question.question_description).to eq(
          'How satisfied are you with your current',
        )
        expect(question.question_description(with_content: true)).to eq(
          'How satisfied are you with your current socks?',
        )
      end
    end
  end
end
