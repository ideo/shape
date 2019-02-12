require 'rails_helper'

RSpec.describe Item::ChartItem, type: :model do
  context 'associations' do
    it { should belong_to(:data_source) }
  end

  describe 'chart_data' do
    let(:chart_data) { chart_item.chart_data }

    context 'with question item' do
      let!(:chart_item) { create(:chart_item, :with_question_item) }

      it 'calls DataSource::QuestionItem' do
        allow(DataSource::QuestionItem).to receive(:call).and_return(data: {})
        expect(DataSource::QuestionItem).to receive(:call).with(
          chart_item: chart_item,
          question_item: chart_item.data_source,
        )
        expect(chart_data).to eq(data: {})
      end
    end

    context 'with remote url' do
      let!(:chart_item) { create(:chart_item, :with_remote_url) }

      it 'calls DataSource::External' do
        allow(DataSource::External).to receive(:call).and_return(data: {})
        expect(DataSource::External).to receive(:call).with(
          chart_item: chart_item,
        )
        expect(chart_data).to eq(data: {})
      end
    end

    context 'with unsupported data source' do
      let!(:fake_item) { create(:text_item) }
      let!(:chart_item) { create(:chart_item, data_source: fake_item) }

      it 'should return empty hash' do
        expect(chart_data).to eq({})
      end
    end
  end
end
