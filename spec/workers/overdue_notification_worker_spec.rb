require 'rails_helper'

RSpec.describe OverdueNotificationWorker, type: :worker do
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             overdue_at: 1.month.ago)
    end
    let!(:overdue_at_not_set) do
      create(:organization,
             in_app_billing: true,
             overdue_at: nil)
    end
    let!(:overdue_1_day) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 1.day.ago)
    end
    let!(:overdue_3_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 3.days.ago)
    end
    let!(:overdue_7_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 7.days.ago)
    end
    let!(:overdue_9_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 9.days.ago)
    end
    let!(:overdue_10_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 10.days.ago)
    end
    let!(:overdue_11_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 11.days.ago)
    end
    let!(:overdue_100_days) do
      create(:organization,
             in_app_billing: true,
             overdue_at: 100.days.ago)
    end

    it 'sends mail to organizations that meet the criteria' do
      expect(BillingOverdueMailer).not_to receive(:notify).with(in_app_billing_disabled)
      expect(BillingOverdueMailer).not_to receive(:notify).with(overdue_at_not_set)
      expect(BillingOverdueMailer).not_to receive(:notify).with(
        overdue_3_days, 3
      )
      expect(BillingOverdueMailer).not_to receive(:notify).with(
        overdue_9_days, 9
      )

      expect(BillingOverdueMailer).to receive(:notify).with(
        overdue_1_day, 1
      )
      expect(BillingOverdueMailer).to receive(:notify).with(
        overdue_7_days, 7
      )
      expect(BillingOverdueMailer).to receive(:notify).with(
        overdue_10_days, 10
      )
      expect(BillingOverdueMailer).to receive(:notify).with(
        overdue_11_days, 11
      )
      expect(BillingOverdueMailer).to receive(:notify).with(
        overdue_100_days, 100
      )

      OverdueNotificationWorker.new.perform
    end
  end
end
