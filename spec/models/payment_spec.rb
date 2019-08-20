require 'rails_helper'

RSpec.describe Payment, type: :model do
  let(:payment_errors) { [] }
  let(:payment_method_double) { double(id: SecureRandom.hex(10)) }
  before do
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

  # Truncation must be used when testing double entry
  describe '#create', truncate: true do
    let(:payment) { build(:payment) }
    let(:cash_account) { DoubleEntry.account(:cash, scope: payment) }
    let(:revenue_deferred) { DoubleEntry.account(:revenue_deferred, scope: payment) }
    let(:payment_processor) { DoubleEntry.account(:payment_processor, scope: payment) }

    it 'calls NetworkApi::Payment.create' do
      expect(NetworkApi::Payment).to receive(:create).with(
        payment_method_id: payment.network_payment_method_id,
        amount: payment.amount,
        description: payment.description,
        quantity: payment.quantity,
        unit_amount: payment.unit_amount,
      )
      payment.save
    end

    it 'adds to balance in revenue_deferred and payment processor' do
      payment.save
      stripe_fee = ((payment.amount * 0.029) + 0.3).round(2)
      expect(cash_account.balance.to_f).to eq(-payment.amount)
      expect(revenue_deferred.balance.to_f).to eq(payment.amount - stripe_fee)
      expect(payment_processor.balance.to_f).to eq(stripe_fee)
    end

    context 'if payment fails' do
      let!(:payment_errors) { ['Bank declined the card'] }

      it 'does not save' do
        expect(payment.save).to be false
      end

      it 'returns error' do
        payment.save
        expect(payment.errors.full_messages).to eq(
          ['Bank declined the card'],
        )
      end
    end
  end

  describe '#stripe_fee' do
    let(:payment) { build(:payment, amount: 10.00) }

    it 'is 2.9% + 0.30' do
      expect(payment.stripe_fee.to_f).to eq(0.59)
    end
  end
end
