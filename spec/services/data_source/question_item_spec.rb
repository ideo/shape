require 'rails_helper'

RSpec.describe DataSource::QuestionItem, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, organization: organization) }
  let(:question_item) { create(:question_item) }
  let(:chart_item) { create(:chart_item, data_source: question_item) }
  let!(:parent_collection_card) do
    create(:collection_card,
           parent: collection,
           item: chart_item)
  end
  let(:empty_dataset) do
    [
      {
        num_responses: 0,
        answer: 1,
      },
      {
        num_responses: 0,
        answer: 2,
      },
      {
        num_responses: 0,
        answer: 3,
      },
      {
        num_responses: 0,
        answer: 4,
      },
    ]
  end

  subject {
    DataSource::QuestionItem.call(
      chart_item: chart_item,
      question_item: question_item,
    )
  }

  describe '#call' do
    it 'returns datasets for question item' do
      expect(subject[:datasets]).to match_array([
        {
          label: collection.name,
          type: 'question_items',
          total: 0,
          data: empty_dataset,
        },
        {
          label: organization.name,
          type: 'org_wide',
          total: 0,
          data: empty_dataset,
        },
      ])
    end

    it 'returns columns of 1 to 4' do
      expect(subject[:columns]).to eq([
        { title: 1 },
        { title: 2 },
        { title: 3 },
        { title: 4 },
      ])
    end

    it 'returns no filters' do
      expect(subject[:filters]).to be_empty
    end

    context 'with responses' do
      let(:test_collection) { create(:test_collection, num_cards: 1, organization: organization) }
      # Create another test collection so we have other responses in the org
      let(:other_test_collection) { create(:test_collection, :with_responses, organization: organization) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
      let!(:question_item) { survey_response.question_items.select(&:question_useful?).first }
      let!(:question_answer) do
        create(:question_answer,
               survey_response: survey_response,
               question: question_item)
      end
      let!(:chart_item) { create(:chart_item, data_source: question_item) }
      let(:card) { test_collection.collection_cards.first }

      before do
        survey_response.update_attribute(:status, :completed)
        other_test_collection.reload
        card.update(item: chart_item)
      end

      it 'should return an array of question scale to amount' do
        expect(subject[:datasets]).to match_array([
            {
              label: test_collection.name,
              type: 'question_items',
              total: 1,
              data: [
                { num_responses: 1, answer: 1 },
                { num_responses: 0, answer: 2 },
                { num_responses: 0, answer: 3 },
                { num_responses: 0, answer: 4 },
              ],
            },
            {
              label: test_collection.organization.name,
              type: 'org_wide',
              total: 6,
              data: [
                { num_responses: 6, answer: 1 },
                { num_responses: 0, answer: 2 },
                { num_responses: 0, answer: 3 },
                { num_responses: 0, answer: 4 },
              ],
            },
          ],
        )
      end
    end
  end
end
