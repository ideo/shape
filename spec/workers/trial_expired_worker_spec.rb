require 'rails_helper'

RSpec.describe TrialExpiredWorker, type: :worker do
  describe '#perform' do
    let!(:already_sent) do
      create(:organization,
             trial_expired_email_sent: true,
             in_app_billing: true,
             trial_ends_at: 1.day.ago)
    end
    let!(:in_app_billing_disabled) do
      create(:organization,
             trial_expired_email_sent: false,
             in_app_billing: false,
             trial_ends_at: 1.day.ago)
    end
    let!(:trial_has_not_ended) do
      create(:organization,
             trial_expired_email_sent: false,
             in_app_billing: true,
             trial_ends_at: 1.day.from_now)
    end
    let!(:should_process_a) do
      create(:organization,
             trial_expired_email_sent: false,
             in_app_billing: true,
             trial_ends_at: 1.day.ago)
    end
    let!(:should_process_b) do
      create(:organization,
             trial_expired_email_sent: false,
             in_app_billing: true,
             trial_ends_at: 1.day.ago)
    end

    it 'sends notices to organizations that meet the criteria' do
      expect(TrialExpiredMailer).to receive(:notify).with(should_process_a)
      expect(TrialExpiredMailer).to receive(:notify).with(should_process_b)
      expect(TrialExpiredMailer).not_to receive(:notify).with(already_sent)
      expect(TrialExpiredMailer).not_to receive(:notify).with(in_app_billing_disabled)
      expect(TrialExpiredMailer).not_to receive(:notify).with(trial_has_not_ended)
      TrialExpiredWorker.new.perform
    end

    it 'updates the organizations to indicate the email has been sent' do
      expect(should_process_a.trial_expired_email_sent).to be false
      expect(should_process_b.trial_expired_email_sent).to be false
      TrialExpiredWorker.new.perform
      expect(should_process_a.reload.trial_expired_email_sent).to be true
      expect(should_process_b.reload.trial_expired_email_sent).to be true
    end
  end
end
