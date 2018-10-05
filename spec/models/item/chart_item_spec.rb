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
      let!(:survey_response) { create(:survey_response) }
      let!(:question_item) { survey_response.question_items.select(&:question_useful?).first }
      let!(:question_answer) do
        create(:question_answer,
               survey_response: survey_response,
               question: question_item)
      end
      let!(:chart_item) { create(:chart_item) }

      before do
        survey_response.update_attribute(:status, :completed)
        chart_item.update(data_source: question_item)
      end

      it 'should return an array of question scale to amount' do
        # TODO: finish this test
        # expect(chart_item.chart_data).to eq(0)
      end
    end
  end
end
