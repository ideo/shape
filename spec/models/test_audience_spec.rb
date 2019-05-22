require 'rails_helper'

RSpec.describe TestAudience, type: :model do
  context 'associations' do
    it { should belong_to :audience }
    it { should belong_to :test_collection }
  end

  let(:test_collection) { create(:test_collection) }
  let(:user) { create(:user) }
  let(:audience) { create(:audience) }
  let(:test_audience) do
    build(:test_audience,
          audience: audience,
          test_collection: test_collection,
          sample_size: 10,
          launched_by: user,
          price_per_response: 9.99)
  end

  describe '#total_price' do
    it 'returns sample_size * price_per_response' do
      expect(test_audience.total_price.to_f).to eq(99.9)
    end
  end

  describe '#description' do
    it 'returns correct description' do
      expect(test_audience.description).to eq(
        "#{user.name} launched #{test_collection.name} test with " \
        "#{test_audience.sample_size} total #{test_audience.audience_name} audience " \
        "respondents at $#{format('%.2f', test_audience.price_per_response)}",
      )
    end
  end
end
