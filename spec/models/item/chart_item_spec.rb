require 'rails_helper'

RSpec.describe Item::ChartItem, type: :model do
  context 'associations' do
    it { should belong_to(:data_source) }
  end

  describe 'chart_data' do
    let!(:chart_item) { create(:chart_item) }

    context 'when the data source is a non-question item' do
      let!(:fake_item) { create(:text_item) }

      before do
        chart_item.update_attribute(:data_source, fake_item)
      end

      it 'should return nothing' do
        expect(chart_item.chart_data).to be_nil
      end
    end

    context 'when the data source is a question item with responses' do
      let(:organization) { create(:organization) }
      let(:test_collection) { create(:test_collection, num_cards: 1, organization: organization) }
      let(:other_test_collection) { create(:test_collection, organization: organization) }
      let!(:org_survey_responses) { create_list(:survey_response, 5, test_collection: other_test_collection) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
      let!(:org_question_items) do
        org_survey_responses.map do |response|
          question = response.question_items.select(&:question_useful?).first
          create(:question_answer,
                 survey_response: response,
                 question: question)
        end
      end
      let!(:question_item) { survey_response.question_items.select(&:question_useful?).first }
      let!(:question_answer) do
        create(:question_answer,
               survey_response: survey_response,
               question: question_item)
      end
      let!(:chart_item) { create(:chart_item) }
      let(:card) { test_collection.collection_cards.first }

      before do
        survey_response.update_attribute(:status, :completed)
        org_survey_responses.map { |r| r.update_attribute(:status, :completed) }
        chart_item.update(data_source: question_item)
        card.update(item: chart_item)
      end

      it 'should return an array of question scale to amount' do
        expect(chart_item.chart_data).to eq(
          datasets: [
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
