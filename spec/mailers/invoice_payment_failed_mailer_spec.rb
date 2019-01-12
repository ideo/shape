require 'rails_helper'

def format_currency(x)
  format('$%.2f', x.round(2))
end

RSpec.describe InvoicePaymentFailedMailer, type: :mailer do
  let!(:organization) { create(:organization, active_users_count: 123) }
  let!(:user) { create(:user) }
  let!(:payment_method) { double('payment_method', id: 123, user: user, brand: 'thebrand', last4: 4321) }
  let!(:payment_method_results) { [payment_method] }

  before do
    includes = double('includes')

    allow(NetworkApi::PaymentMethod).to receive(:includes)
      .with(:user).and_return(includes)

    allow(includes).to receive(:find)
      .with(payment_method.id).and_return(payment_method_results)
  end

  describe '#notify' do
    it 'sends to the user associated with the payment method' do
      mail = InvoicePaymentFailedMailer.notify(organization.id, payment_method.id)
      expect(mail.to).to eql([user.email])
    end

    it 'has a subject describing the updated user situation' do
      mail = InvoicePaymentFailedMailer.notify(organization.id, payment_method.id)
      expect(mail.subject).to eq('Shape invoice payment failed')
    end

    it 'renders datails about the invoice payment failure' do
      mail = InvoicePaymentFailedMailer.notify(organization.id, payment_method.id)
      expect(mail.body.encoded).to include("Shape invoice payment failed for #{organization.name}")
      expect(mail.body.encoded).to include('thebrand ending in 4321: DECLINED')
      expect(mail.body.encoded).to include("Next monthly charge: #{format_currency(organization.active_users_count * Organization::PRICE_PER_USER)}")
      expect(mail.body.encoded).to include("Next statement date: #{Time.now.utc.end_of_month.to_s(:mdy)}")
      expect(mail.body.encoded).to include("Add payment method: #{root_url}billing")
    end
  end
end
