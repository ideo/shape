require 'rails_helper'

RSpec.describe MarkAsOverdueWorker, type: :worker do
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             trial_ends_at: 1.week.ago,
             has_payment_method: false,
             active_users_count: 10,
             trial_users_count: 5,
             overdue_at: nil)
    end

    let!(:deactivated) do
      create(:organization,
             deactivated: true,
             in_app_billing: true,
             trial_ends_at: 1.week.ago,
             has_payment_method: false,
             active_users_count: 10,
             trial_users_count: 5,
             overdue_at: nil)
    end

    let!(:has_payment_method) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.ago,
             has_payment_method: true,
             active_users_count: 10,
             trial_users_count: 5,
             overdue_at: nil)
    end

    let!(:already_set_as_overdue) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.ago,
             has_payment_method: false,
             active_users_count: 10,
             trial_users_count: 5,
             overdue_at: 1.week.ago)
    end

    let!(:has_not_exceeded_user_count_within_trial) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.from_now,
             has_payment_method: false,
             active_users_count: 1,
             trial_users_count: 5,
             overdue_at: nil)
    end

    let!(:has_exceeded_user_count_within_trial) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.from_now,
             has_payment_method: false,
             active_users_count: 10,
             trial_users_count: 5,
             overdue_at: nil)
    end

    let!(:trial_ended) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.ago,
             has_payment_method: false,
             active_users_count: 1,
             trial_users_count: 5,
             overdue_at: nil)
    end

    it 'sets overdue_at for organizations that meet the criteria' do
      MarkAsOverdueWorker.new.perform

      [
        deactivated,
        in_app_billing_disabled,
        has_payment_method,
        already_set_as_overdue,
        has_not_exceeded_user_count_within_trial,
      ].each do |org|
        expect { org.reload }.not_to change { org.overdue_at.try(:round) }
      end

      [
        has_exceeded_user_count_within_trial,
        trial_ended,
      ].each do |org|
        expect { org.reload }.to change { org.overdue_at.try(:round) }
        expect(org.overdue_at).to be_within(5.seconds).of Time.current
      end
    end
  end
end
