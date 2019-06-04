require 'rails_helper'

RSpec.describe TestAudience, type: :model do
  context 'associations' do
    it { should belong_to :audience }
    it { should belong_to :test_collection }
    it { should have_many :survey_responses }
  end

  describe 'callbacks' do
    describe '#closed?' do
      let(:user) { create(:user) }
      let(:test_collection) { create(:test_collection, :completed) }
      before do
        test_collection.launch!(initiated_by: user)
        expect(test_collection.live?).to be true
        expect(test_audience.closed_at).to be_nil
      end
      let(:test_audience) { create(:test_audience, test_collection: test_collection, sample_size: 5) }

      context 'when it has received enough completed responses' do
        let!(:survey_responses) do
          create_list(
            :survey_response,
            5,
            :fully_answered,
            test_audience: test_audience,
            test_collection: test_collection,
          )
        end

        it 'returns true' do
          expect(test_audience.reload.closed?).to be true
          expect(test_audience.closed_at).not_to be_nil
        end

        it 'closes the test' do
          expect(test_collection.reload.closed?).to be true
        end
      end

      context 'when it has not received enough responses' do
        let!(:survey_responses) { create_list(:survey_response, 2, :fully_answered, test_audience: test_audience) }

        it 'returns false' do
          expect(test_audience.reload.closed?).to be false
        end

        it 'leaves the test open' do
          expect(test_collection.reload.live?).to be true
        end
      end
    end
  end

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
      ),
    )
  end
  let(:test_collection) { create(:test_collection) }
  let(:user) { create(:user) }
  let(:audience) { create(:audience, price_per_response: 9.99) }
  let!(:test_audience) do
    build(:test_audience,
          audience: audience,
          test_collection: test_collection,
          sample_size: 10,
          launched_by: user)
  end

  describe 'callbacks' do
    describe '#purchase' do
      it 'charges organization payment method' do
        # .valid? is also necessary to generate description
        expect(test_audience.valid?).to be true
        expect(NetworkApi::Payment).to receive(:create).with(
          payment_method_id: payment_method_double.id,
          amount: test_audience.total_price.to_f,
          description: test_audience.description,
          quantity: test_audience.sample_size,
          unit_amount: audience.price_per_response.to_f,
        )
        # set the payment method
        test_audience.payment_method = payment_method_double
        test_audience.save
      end

      context 'if payment fails' do
        let!(:payment_errors) { ['Bank declined the card'] }
        before do
          test_audience.payment_method = payment_method_double
          test_audience.save
        end

        it 'is not successful' do
          expect(test_audience.persisted?).to be false
        end

        it 'returns error' do
          expect(test_audience.errors.full_messages).to eq(
            ['Payment failed: Bank declined the card'],
          )
        end
      end

      context 'if price_per_response is 0' do
        before do
          test_audience.price_per_response = 0
        end

        it 'does not charge payment method' do
          expect(test_audience.total_price).to eq(0)
          expect(NetworkApi::Payment).not_to have_received(:create)
          test_audience.save
        end
      end
    end
  end

  context 'if saved' do
    before { test_audience.save }

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
end
