require 'rails_helper'

RSpec.describe DataReport::QuestionItem, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, organization: organization) }
  let(:question_item) { create(:question_item) }
  let(:data_item) { create(:data_item, :report_type_question_item, data_source: question_item) }
  let!(:parent_collection_card) do
    create(:collection_card,
           parent: collection,
           item: data_item)
  end
  let(:empty_dataset) do
    [
      {
        column: 1, value: 0, total: 0, percentage: 0, type: question_item.question_type
      },
      {
        column: 2, value: 0, total: 0, percentage: 0, type: question_item.question_type
      },
      {
        column: 3, value: 0, total: 0, percentage: 0, type: question_item.question_type
      },
      {
        column: 4, value: 0, total: 0, percentage: 0, type: question_item.question_type
      },
    ]
  end

  subject {
    DataReport::QuestionItem.call(data_item)
  }

  describe '#call' do
    it 'returns datasets for question item' do
      expect(subject[0].except(:data)).to eq(
        order: 0,
        chart_type: 'bar',
        measure: collection.name,
        question_type: question_item.question_type,
        total: 0,
        timeframe: 'month',
        max_domain: 95,
      )
      expect(subject[0][:data]).to match_array(empty_dataset)

      expect(subject[1].except(:data)).to eq(
        order: 1,
        chart_type: 'bar',
        measure: "#{organization.name} Organization",
        question_type: question_item.question_type,
        total: 0,
        timeframe: 'month',
        max_domain: 95,
      )
      expect(subject[1][:data]).to match_array(empty_dataset)
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
      let!(:data_item) { create(:data_item, :report_type_question_item, data_source: question_item) }
      let(:card) { test_collection.collection_cards.first }

      before do
        survey_response.update_attribute(:status, :completed)
        other_test_collection.reload
        card.update(item: data_item)
      end

      it 'should return an array of question scale to amount' do
        expect(subject[0].except(:data)).to eq(
          order: 0,
          chart_type: 'bar',
          measure: test_collection.name,
          question_type: question_item.question_type,
          total: 1,
          timeframe: 'month',
          max_domain: 95,
        )
        expect(subject[0][:data]).to match_array(
          [
            { column: 1, value: 1, total: 1, percentage: 100, type: question_item.question_type },
            { column: 2, value: 0, total: 0, percentage: 0, type: question_item.question_type },
            { column: 3, value: 0, total: 0, percentage: 0, type: question_item.question_type },
            { column: 4, value: 0, total: 0, percentage: 0, type: question_item.question_type },
          ]
        )

        expect(subject[1].except(:data)).to eq(
          order: 1,
          chart_type: 'bar',
          measure: "#{test_collection.organization.name} Organization",
          question_type: question_item.question_type,
          total: 6,
          timeframe: 'month',
          max_domain: 95,
        )
        expect(subject[1][:data]).to match_array(
          [
            { column: 1, value: 6, total: 6, percentage: 100, type: question_item.question_type },
            { column: 2, value: 0, total: 0, percentage: 0, type: question_item.question_type },
            { column: 3, value: 0, total: 0, percentage: 0, type: question_item.question_type },
            { column: 4, value: 0, total: 0, percentage: 0, type: question_item.question_type },
          ]
        )
      end
    end
  end
end
