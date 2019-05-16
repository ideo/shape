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
    let(:test_collection) { create(:test_collection) }
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

    describe '#score' do
      let!(:response) { create(:survey_response, test_collection: test_collection) }
      # cheating here because a survey_response should really only have one answer per question
      let!(:answer1) { create(:question_answer, survey_response: response, question: question_item, answer_number: 1) }
      let!(:answer2) { create(:question_answer, survey_response: response, question: question_item, answer_number: 2) }
      let!(:answer3) { create(:question_answer, survey_response: response, question: question_item, answer_number: 2) }
      let!(:answer4) { create(:question_answer, survey_response: response, question: question_item, answer_number: 4) }
      before do
        response.update(status: :completed)
        question_item.update(question_type: :question_useful)
      end

      it 'should calculate the score based on answer_numbers' do
        # should be 0 + 1 + 1 + 3 / 12 = 42%
        expect(question_item.score).to eq 42
      end
    end

    context 'role access within a test collection' do
      it 'should defer to parent for resourceable capabilities' do
        expect(question_item.can_edit?(user)).to be true
        expect(question_item.can_edit?(user2)).to be false
        expect(question_item.can_view?(user2)).to be true
      end
    end
  end

  describe '#create_response_graph' do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:test_collection) do
      create(:test_collection, :completed, organization: organization, add_editors: [user])
    end
    before do
      test_collection.launch!(initiated_by: user)
      test_collection.reload
    end
    let(:scale_questions) do
      test_collection
        .question_items
        .where(
          question_type: Item::QuestionItem.question_type_categories[:scaled_rating],
        )
    end
    let(:question_item) { scale_questions.first }
    let(:data_item) do
      question_item.create_response_graph(
        parent_collection: test_collection,
        initiated_by: user,
      ).record
    end
    let(:org_wide_question_dataset) do
      Dataset::OrgWideQuestion.find_by(
        organization: organization,
        question_type: question_item.question_type,
      )
    end

    it 'creates DataItem on test collection for the question' do
      expect { data_item }.to change(Item::DataItem, :count).by(1)
    end

    it 'adds dataset' do
      expect(data_item.datasets).to include(question_item.dataset)
    end

    it 'adds org-wide dataset' do
      expect(org_wide_question_dataset.persisted?).to be true
      expect(data_item.datasets).to include(org_wide_question_dataset)
    end
  end
end
