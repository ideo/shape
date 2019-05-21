require 'rails_helper'

describe TestAudiencePurchaser, type: :service do
  let(:payment_errors) { [] }
  let(:payment_method_double) { double(id: SecureRandom.hex(10)) }
  before do
    allow(NetworkApi::Organization).to receive(:find_by_external_id).and_return(
      double(id: SecureRandom.hex(10)),
    )
    allow(NetworkApi::PaymentMethod).to receive(:find).and_return(
      [payment_method_double],
    )
    allow(NetworkApi::Payment).to receive(:create).and_return(
      double(
        id: SecureRandom.hex(10),
        status: payment_errors.present? ? 'failed' : 'succeeded',
        errors: double(
          ':[]': payment_errors,
          full_messages: payment_errors,
        ),
      )
    )
  end
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
  let!(:result) do
    TestAudiencePurchaser.call(
      test_collection: test_collection,
      test_audience_params: test_audience_params,
    )
  end
  let(:total_price) do
    result.total_price
  end

  context 'with a paid audience' do
    let(:audience) { create(:audience, price_per_response: 5) }

    it 'is successful' do
      expect(result.success?).to be true
    end

    it 'calculates total_price' do
      expect(total_price).to eq 5 * sample_size
    end

    it 'creates test audiences matching the audience' do
      expect(test_collection.test_audiences.count).to eq 1
      expect(test_collection.test_audiences.first.price_per_response).to eq 5
    end

    context 'without payment method' do
      let!(:payment_method_double) { nil }

      it 'is not successful' do
        expect(result.success?).to be false
      end

      it 'returns error' do
        expect(result.message).to eq('No valid payment method has been added')
      end
    end

    context 'if payment fails' do
      let!(:payment_errors) { ['Bank declined the card'] }

      it 'is not successful' do
        expect(result.success?).to be false
      end

      it 'returns error' do
        expect(result.message).to eq('Payment failed: Bank declined the card')
      end
    end
  end

  context 'with a free (link sharing) audience' do
    let(:audience) { create(:audience, price_per_response: 0) }

    it 'is successful' do
      expect(result.success?).to be true
    end

    it 'calculates total_price' do
      expect(total_price).to eq 0
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

    it 'is successful' do
      expect(result.success?).to be false
    end

    it 'returns an error' do
      expect(test_collection.errors[:test_audiences]).to eq(['not found'])
      expect(test_collection.errors.present?).to be true
    end
  end
end
