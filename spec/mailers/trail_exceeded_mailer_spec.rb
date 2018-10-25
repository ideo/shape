require 'rails_helper'

RSpec.describe TrialExpiredMailer, type: :mailer do
  describe '#notify' do
    let(:organization) { create(:organization, trial_ends_at: 1.day.from_now) }
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }
    let(:user_c) { create(:user) }
    let(:network_organization) { double('network_organization', id: 123) }

    before do
      allow(organization).to receive(:network_organization).and_return(network_organization)
      allow(NetworkApi::PaymentMethod).to receive(:find).with(organization_id: network_organization.id).and_return([])
      user_a.add_role(Role::ADMIN, organization.admin_group)
      user_b.add_role(Role::ADMIN, organization.admin_group)
    end

    it 'has a subject' do
      mail = TrialExpiredMailer.notify(organization)
      expect(mail.subject).to eq('Free trial expired')
    end

    it 'sends to org admins' do
      mail = TrialExpiredMailer.notify(organization)
      expect(mail.to.length).to eql(2)
      expect(mail.to).to include(user_a.email)
      expect(mail.to).to include(user_b.email)
      expect(mail.to).not_to include(user_c.email)
    end

    it 'renders details about the organization' do
      mail = TrialExpiredMailer.notify(organization)
      expect(mail.body.encoded).to match('Free trial expired')
      expect(mail.body.encoded).to match(organization.name.to_s)
      expect(mail.body.encoded).to match("Expiration Date: #{organization.trial_ends_at.to_s(:mdy)}")
      expect(mail.body.encoded).to match("Total users: #{organization.active_users_count}")
    end

    context 'missing payment method' do
      it 'renders the link to billing' do
        mail = TrialExpiredMailer.notify(organization)
        expect(mail.body.encoded).to match("Add payment method: #{root_url}/billing")
      end
    end

    context 'has payment method' do
      it 'does not render the link to billing' do
        allow(NetworkApi::PaymentMethod).to receive(:find).with(organization_id: network_organization.id).and_return(['a payment method'])
        mail = TrialExpiredMailer.notify(organization)
        expect(mail.body.encoded).not_to match("Add payment method: #{root_url}/billing")
      end
    end
  end
end
