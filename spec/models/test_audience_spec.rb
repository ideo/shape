require 'rails_helper'

RSpec.describe TestAudience, type: :model do
  context 'associations' do
    it { should belong_to :audience }
    it { should belong_to :test_collection }
    it { should have_many :survey_responses }
  end

  describe '#closed?' do
    let(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, test_collection: test_collection, sample_size: 5) }

    context 'when it has received enough completed responses' do
      let!(:survey_responses) { create_list(:survey_response, 5, status: :completed, test_audience: test_audience) }

      it 'returns true' do
        expect(test_audience.closed?).to be true
      end
    end

    context 'when it has not received enough responses' do
      let!(:survey_responses) { create_list(:survey_response, 2, status: :completed, test_audience: test_audience) }

      it 'returns false' do
        expect(test_audience.closed?).to be false
      end
    end
  end
end
