require 'rails_helper'

RSpec.describe OverdueNotificationWorker, type: :worker do
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             overdue_at: 1.month.ago,
             active_users_count: 1)
    end
    let!(:deactivated) do
      create(:organization,
             deactivated: true,
             in_app_billing: true,
             overdue_at: 1.month.ago,
             active_users_count: 1)
    end
    let!(:overdue_at_not_set) do
      create(:organization,
             in_app_billing: true,
             overdue_at: nil,
             active_users_count: 1)
    end
    let!(:overdue_1_day) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 1.day.ago,
             active_users_count: 1)
    end
    let!(:overdue_3_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 3.days.ago,
             active_users_count: 1)
    end
    let!(:overdue_7_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 7.days.ago,
             active_users_count: 1)
    end
    let!(:overdue_9_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 9.days.ago,
             active_users_count: 1)
    end
    let!(:overdue_14_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 14.days.ago,
             active_users_count: 1)
    end
    let!(:overdue_21_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 21.days.ago,
             active_users_count: 1)
    end
    let!(:overdue_100_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 100.days.ago,
             active_users_count: 1)
    end
    let!(:not_active) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 100.days.ago,
             active_users_count: 0)
    end

    it 'sends mail to organizations that meet the criteria' do
      # criteria is overdue in 1 day, 7 days, or >=10 days
      mailer = double
      allow(mailer).to receive(:deliver_later)
      allow(BillingOverdueMailer).to receive(:notify).and_return(mailer)

      expect(mailer).to receive(:deliver_later).exactly(4).times

      expect(BillingOverdueMailer).not_to receive(:notify).with(in_app_billing_disabled)
      expect(BillingOverdueMailer).not_to receive(:notify).with(deactivated)
      expect(BillingOverdueMailer).not_to receive(:notify).with(overdue_at_not_set)
      expect(BillingOverdueMailer).not_to receive(:notify).with(not_active)
      expect(BillingOverdueMailer).not_to receive(:notify).with(overdue_3_days)
      expect(BillingOverdueMailer).not_to receive(:notify).with(overdue_9_days)
      expect(BillingOverdueMailer).not_to receive(:notify).with(overdue_100_days)

      expect(BillingOverdueMailer).to receive(:notify).with(overdue_1_day)
      expect(BillingOverdueMailer).to receive(:notify).with(overdue_7_days)
      expect(BillingOverdueMailer).to receive(:notify).with(overdue_14_days)
      expect(BillingOverdueMailer).to receive(:notify).with(overdue_21_days)

      OverdueNotificationWorker.new.perform
    end
  end
end
