require 'rails_helper'

def format_currency(x)
  format('$%.2f', x.round(2))
end

RSpec.describe ChargesLimitMailer, type: :mailer do
  describe '#notify' do
    let(:organization) { create(:organization, active_users_count: 123) }

    it 'has a subject' do
      mail = ChargesLimitMailer.notify(organization)
      expect(mail.subject).to eq("High monthly bill for #{organization.name}")
    end

    it 'sends to shape support' do
      mail = ChargesLimitMailer.notify(organization)
      expect(mail.to).to eql([Shape::SUPPORT_EMAIL])
    end

    it 'renders a message details about the organization' do
      mail = ChargesLimitMailer.notify(organization)
      expect(mail.body.encoded).to include("#{organization.name} has #{organization.active_users_count} active users and monthly charge will be #{format_currency(organization.active_users_count * Organization::PRICE_PER_USER)}. Please reach out to #{organization.name} to arrange a new billing method.")
    end
  end
end
