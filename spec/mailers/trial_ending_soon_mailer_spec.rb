require 'rails_helper'

RSpec.describe TrialEndingSoonMailer, type: :mailer do
  describe '#notify' do
    let(:organization) { create(:organization, trial_ends_at: 1.day.from_now) }
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }
    let(:user_c) { create(:user) }

    before do
      user_a.add_role(Role::ADMIN, organization.admin_group)
      user_b.add_role(Role::ADMIN, organization.admin_group)
    end

    it 'has a subject' do
      mail = TrialEndingSoonMailer.notify(organization, 2)
      expect(mail.subject).to eq('Shape trial ending in 2 days - Add payment method')
      mail = TrialEndingSoonMailer.notify(organization, 7)
      expect(mail.subject).to eq('Shape trial ending in 1 week - Add payment method')
      mail = TrialEndingSoonMailer.notify(organization, 14)
      expect(mail.subject).to eq('Shape trial ending in 2 weeks - Add payment method')
    end

    it 'sends to org admins' do
      mail = TrialEndingSoonMailer.notify(organization, 2)
      expect(mail.to.length).to eql(2)
      expect(mail.to).to include(user_a.email)
      expect(mail.to).to include(user_b.email)
      expect(mail.to).not_to include(user_c.email)
    end

    it 'renders details about the trial ending' do
      mail = TrialEndingSoonMailer.notify(organization, 2)
      expect(mail.body.encoded).to include('Free trial ending in 2 days')
      expect(mail.body.encoded).to include('Add payment method')
      expect(mail.body.encoded).to include("Trial Expiration Date: #{organization.trial_ends_at.to_s(:mdy)}")
      expect(mail.body.encoded).to include("Add payment method: #{root_url}/billing")
      mail = TrialEndingSoonMailer.notify(organization, 7)
      expect(mail.body.encoded).to include('Free trial ending in 1 week')
      mail = TrialEndingSoonMailer.notify(organization, 14)
      expect(mail.body.encoded).to include('Free trial ending in 2 weeks')
    end
  end
end
