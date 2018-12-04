require 'rails_helper'

RSpec.describe TrialEndingSoonWorker, type: :worker do
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             has_payment_method: false,
             trial_ends_at: 7.days.from_now)
    end
    let!(:deactivated) do
      create(:organization,
             deactivated: true,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 7.days.from_now)
    end
    let!(:has_payment_method) do
      create(:organization,
             in_app_billing: false,
             has_payment_method: true,
             trial_ends_at: 7.days.from_now)
    end
    let!(:trial_ended_2_days_ago) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 2.day.ago)
    end
    let!(:trial_ends_in_1_day) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 1.day.from_now)
    end
    let!(:trial_ends_in_2_days) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 2.days.from_now)
    end
    let!(:trial_ends_in_3_days) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 3.days.from_now)
    end
    let!(:trial_ends_in_1_week) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 1.week.from_now)
    end
    let!(:trial_ends_in_2_weeks) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 2.weeks.from_now)
    end
    let!(:trial_ends_in_3_weeks) do
      create(:organization,
             in_app_billing: true,
             has_payment_method: false,
             trial_ends_at: 3.weeks.from_now)
    end

    it 'sends notices to organizations that meet the criteria' do
      mailer = double
      allow(mailer).to receive(:deliver_now)
      allow(TrialEndingSoonMailer).to receive(:notify).and_return(mailer)

      expect(mailer).to receive(:deliver_now).thrice

      expect(TrialEndingSoonMailer).to receive(:notify).with(
        trial_ends_in_2_days, 2
      )
      expect(TrialEndingSoonMailer).to receive(:notify).with(
        trial_ends_in_1_week, 7
      )
      expect(TrialEndingSoonMailer).to receive(:notify).with(
        trial_ends_in_2_weeks, 14
      )
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(has_payment_method)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(in_app_billing_disabled)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(deactivated)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ended_2_days_ago)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_1_day)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_3_days)
      expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_3_weeks)
      TrialEndingSoonWorker.new.perform
    end
  end
end
