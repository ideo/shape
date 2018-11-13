require 'rails_helper'

RSpec.describe BillingOverdueMailer, type: :mailer do
  describe '#notify' do
    let(:organization) { create(:organization, overdue_at: 1.week.ago) }
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }
    let(:user_c) { create(:user) }

    before do
      user_a.add_role(Role::ADMIN, organization.admin_group)
      user_b.add_role(Role::ADMIN, organization.admin_group)
    end

    it 'has a subject' do
      mail = BillingOverdueMailer.notify(organization)
      expect(mail.subject).to eq('Shape Payment Overdue')
    end

    it 'sends to org admins' do
      mail = BillingOverdueMailer.notify(organization)
      expect(mail.to.length).to eql(2)
      expect(mail.to).to include(user_a.email)
      expect(mail.to).to include(user_b.email)
      expect(mail.to).not_to include(user_c.email)
    end

    it 'renders details' do
      mail = BillingOverdueMailer.notify(organization)
      expect(mail.body.encoded).to include("Please add a payment method to continue using Shape at #{organization.name}. The #{organization.name} instance of Shape will be frozen on #{(organization.overdue_at + 2.weeks).to_s(:mdy)} if you do not add a valid payment method.")
      expect(mail.body.encoded).to include("Add payment method: #{root_url}billing")
    end
  end
end
