require 'rails_helper'

describe TestAudiencePurchaser, type: :service do
  let(:test_collection) { create(:test_collection) }
  let(:sample_size) { 10 }
  let(:test_audience_params) do
    {
      audience.id => {
        selected: true,
        sample_size: sample_size,
      },
    }
  end
  let(:service) { TestAudiencePurchaser.new(test_collection, test_audience_params) }

  before do
    service.call
  end

  context 'with a paid audience' do
    let(:audience) { create(:audience, price_per_response: 5) }

    it 'calculates total_price' do
      expect(service.total_price).to eq 5 * sample_size
    end

    it 'creates test audiences matching the audience' do
      expect(test_collection.test_audiences.count).to eq 1
      expect(test_collection.test_audiences.first.price_per_response).to eq 5
    end
  end

  context 'with a free (link sharing) audience' do
    let(:audience) { create(:audience, price_per_response: 0) }

    it 'calculates total_price' do
      expect(service.total_price).to eq 0
    end

    it 'creates test audiences matching the audience' do
      expect(test_collection.test_audiences.count).to eq 1
      expect(test_collection.test_audiences.first.price_per_response).to eq 0
    end
  end

  context 'with no audiences' do
    let(:test_audience_params) do
      { 99 => { selected: true } }
    end

    it 'returns an error' do
      expect(test_collection.errors.present?).to be true
    end
  end
end
