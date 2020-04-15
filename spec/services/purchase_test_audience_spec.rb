require 'rails_helper'

describe PurchaseTestAudience, type: :service do
  let(:payment_errors) { [] }
  let(:payment_method_double) { double(id: rand(1000..100_000)) }
  before do
    allow(NetworkApi::Organization).to receive(:find_by_external_id).and_return(
      double(id: rand(1000..100_000)),
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
      ),
    )
  end
  let(:test_collection) { create(:test_collection) }
  let(:user) { create(:user) }
  let(:sample_size) { 10 }
  let(:test_audience_params) do
    audiences
      .each_with_object({}) do |audience, h|
      h[audience.id] = {
        selected: true,
        sample_size: sample_size,
      }
    end
  end
  let!(:result) do
    PurchaseTestAudience.call(
      test_collection: test_collection,
      test_audience_params: test_audience_params,
      user: user,
    )
  end

  context 'with a paid audience', truncate: true do
    let(:audiences) { create_list(:audience, 2, min_price_per_response: 5) }
    let(:open_test_audiences) { test_collection.test_audiences.open }

    before do
      # remove this for the purpose of this test
      test_collection.link_sharing_audience.closed!
      test_collection.reload
    end

    it 'is successful' do
      expect(result.success?).to be true
    end

    it 'creates test audiences matching the audience' do
      expect(open_test_audiences.count).to eq 2
      expect(open_test_audiences.first.price_per_response).to eq 5
      expect(open_test_audiences.last.price_per_response).to eq 5
    end

    it 'calls NetworkApi::Payment.create' do
      open_test_audiences.each do |test_audience|
        expect(NetworkApi::Payment).to have_received(:create).with(
          payment_method_id: payment_method_double.id,
          amount: test_audience.total_price,
          description: test_audience.description,
          quantity: test_audience.sample_size,
          unit_amount: test_audience.price_per_response,
        )
      end
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
        expect(result.message).to eq(
          "Could not purchase #{audiences[0].name} audience. " \
          'Payment failed: Bank declined the card.',
        )
      end
    end
  end

  context 'with a free (link sharing) audience' do
    let(:audiences) { [test_collection.link_sharing_audience.audience] }

    it 'is successful' do
      expect(result.success?).to be true
    end

    it 'creates test audiences matching the audience' do
      expect(test_collection.test_audiences.count).to eq 1
      expect(test_collection.test_audiences.first.price_per_response).to eq 0
    end

    context 'without payment method' do
      let!(:payment_method_double) { nil }

      it 'is still successful' do
        expect(result.success?).to be true
      end
    end

    context 'with the test audience already existing' do
      let!(:test_audience) { create(:test_audience, audience: audiences.first, test_collection: test_collection) }

      it 'should not create it a 2nd time' do
        expect {
          PurchaseTestAudience.call(
            test_collection: test_collection,
            test_audience_params: test_audience_params,
            user: user,
          )
        }.not_to change(test_collection.test_audiences, :size)
        expect(test_collection.test_audiences.size).to eq 1
      end
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
