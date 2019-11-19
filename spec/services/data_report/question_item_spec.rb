require 'rails_helper'

RSpec.describe DataReport::QuestionItem, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, organization: organization) }
  let(:report) do
    DataReport::QuestionItem.call(dataset: dataset)
  end

  context 'no responses' do
    let(:empty_dataset) do
      [
        { column: 1, value: 0, percentage: 0, search_key: nil },
        { column: 2, value: 0, percentage: 0, search_key: nil },
        { column: 3, value: 0, percentage: 0, search_key: nil },
        { column: 4, value: 0, percentage: 0, search_key: nil },
      ]
    end
    let(:question_item) { create(:question_item) }
    let(:dataset) { create(:question_dataset, data_source: question_item) }

    describe '#call' do
      it 'returns datasets for question item' do
        expect(
          report,
        ).to match_array(empty_dataset)
      end
    end
  end

  context 'with responses' do
    let!(:test_collection) { create(:test_collection, :completed, num_cards: 1, organization: organization) }
    before { test_collection.launch! }
    let(:idea) { test_collection.idea_items.first }
    # Create another test collection so we have other responses in the org
    let(:other_test_collection) do
      create(:test_collection,
             :with_responses,
             num_responses: 5,
             organization: organization)
    end
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let!(:question_item) { survey_response.question_items.select(&:question_useful?).first }
    let!(:question_answers) do
      survey_response.question_items.map do |question_item|
        create(:question_answer,
               survey_response: survey_response,
               question: question_item,
               idea: idea)
      end
    end

    before do
      other_test_collection.reload
    end

    context 'question dataset' do
      let!(:dataset) do
        create(
          :question_dataset,
          groupings: [{ type: 'Item', id: idea.id }],
          data_source: question_item,
        )
      end
      let(:answer_search_key) do
        proc do |answer_number|
          TestCollection::AnswerSearchKey.new(
            question: question_item,
            answer_number: answer_number,
          ).for_test(test_collection.id, idea.id)
        end
      end

      describe '#call' do
        it 'returns data for question' do
          expect(report).to match_array(
            [
              { column: 1, value: 1, percentage: 100, search_key: answer_search_key.call(1) },
              { column: 2, value: 0, percentage: 0, search_key: answer_search_key.call(2) },
              { column: 3, value: 0, percentage: 0, search_key: answer_search_key.call(3) },
              { column: 4, value: 0, percentage: 0, search_key: answer_search_key.call(4) },
            ],
          )
        end
      end

      describe '#total' do
        it 'returns 1' do
          expect(
            DataReport::QuestionItem.new(dataset: dataset).total,
          ).to eq(1)
        end
      end
    end

    context 'filtering by org' do
      let!(:dataset) do
        create(:org_wide_question_dataset,
               question_type: question_item.question_type,
               groupings: [{ type: 'Organization', id: organization.id }])
      end
      let(:answer_search_key) do
        proc do |answer_number|
          TestCollection::AnswerSearchKey.new(
            question_type: question_item.question_type,
            answer_number: answer_number,
          ).for_organization(organization.id)
        end
      end

      describe '#call' do
        it 'returns org-wide data' do
          expect(report).to match_array(
            [
              { column: 1, value: 7, percentage: 100, search_key: answer_search_key.call(1) },
              { column: 2, value: 0, percentage: 0, search_key: answer_search_key.call(2) },
              { column: 3, value: 0, percentage: 0, search_key: answer_search_key.call(3) },
              { column: 4, value: 0, percentage: 0, search_key: answer_search_key.call(4) },
            ],
          )
        end
      end

      describe '#total' do
        it 'returns 7' do
          expect(
            DataReport::QuestionItem.new(dataset: dataset).total,
          ).to eq(7)
        end
      end
    end

    context 'filtering by test audience' do
      let!(:audience) { create(:audience, organizations: [organization]) }
      let!(:test_audience) { create(:test_audience, audience: audience, test_collection: test_collection) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }
      let!(:question_item) { survey_response.question_items.select(&:question_useful?).first }
      let(:groupings) do
        [
          { type: 'TestAudience', id: test_audience.id },
          { type: 'Item', id: idea.id },
        ]
      end
      let!(:dataset) do
        create(:question_dataset,
               data_source: question_item,
               question_type: question_item.question_type,
               groupings: groupings)
      end
      let!(:question_answers) do
        survey_response.question_items.map do |question_item|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question_item,
                 idea: idea)
        end
      end
      let(:answer_search_key) do
        proc do |answer_number|
          TestCollection::AnswerSearchKey.new(
            question: question_item,
            answer_number: answer_number,
            audience_id: test_audience.id,
          ).for_test(test_collection.id, idea.id)
        end
      end

      it 'returns test audience data' do
        expect(report).to match_array(
          [
            { column: 1, value: 1, percentage: 100, search_key: answer_search_key.call(1) },
            { column: 2, value: 0, percentage: 0, search_key: answer_search_key.call(2) },
            { column: 3, value: 0, percentage: 0, search_key: answer_search_key.call(3) },
            { column: 4, value: 0, percentage: 0, search_key: answer_search_key.call(4) },
          ],
        )
      end
    end

    context 'filtering by idea' do
      let(:question_item) { test_collection.ideas_question_items.first }
      let(:idea_2) { create(:question_item, question_type: :question_idea, parent_collection: test_collection.ideas_collection) }
      let!(:idea_2_question_answers) do
        create(:question_answer,
               survey_response: survey_response,
               question: question_item,
               idea: idea_2)
      end
      let!(:dataset) do
        create(:question_dataset,
               data_source: question_item,
               question_type: question_item.question_type,
               groupings: [{ type: 'Item', id: idea_2.id }])
      end
      let(:answer_search_key) do
        proc do |answer_number|
          TestCollection::AnswerSearchKey.new(
            question: question_item,
            answer_number: answer_number,
          ).for_test(test_collection.id, idea_2.id)
        end
      end

      it 'returns idea-specific data' do
        expect(question_item.question_answers.size).to eq(2)
        expect(report).to match_array(
          [
            { column: 1, value: 1, percentage: 100, search_key: answer_search_key.call(1) },
            { column: 2, value: 0, percentage: 0, search_key: answer_search_key.call(2) },
            { column: 3, value: 0, percentage: 0, search_key: answer_search_key.call(3) },
            { column: 4, value: 0, percentage: 0, search_key: answer_search_key.call(4) },
          ],
        )
      end
    end
  end
end
