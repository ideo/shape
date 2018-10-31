require 'rails_helper'

RSpec.describe NetworkCreateUsageRecordWorker, type: :worker do
  describe '#perform' do
    context 'everything goes correctly' do
      let(:active_user_count_does_not_change) do
        organization = create(:organization,
                              in_app_billing: true,
                              trial_ends_at: 1.day.ago,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) { true }
        organization
      end

      let(:active_user_count_goes_down) do
        organization = create(:organization,
                              in_app_billing: true,
                              trial_ends_at: 1.day.ago,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) do
          organization.update_attributes(active_users_count: 5)
          true
        end
        organization
      end

      let(:create_network_usage_record_fails) do
        organization = create(:organization,
                              in_app_billing: true,
                              trial_ends_at: 1.day.ago,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) { false }
        organization
      end

      let(:in_app_billing_disabled) do
        organization = create(:organization,
                              in_app_billing: false,
                              trial_ends_at: 1.day.ago,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) do
          organization.update_attributes(active_users_count: 15)
          true
        end
        organization
      end

      let(:within_trial_period) do
        organization = create(:organization,
                              in_app_billing: true,
                              trial_ends_at: 1.day.from_now,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) do
          organization.update_attributes(active_users_count: 15)
          true
        end
        organization
      end

      let(:all_criteria_met) do
        organization = create(:organization,
                              in_app_billing: true,
                              trial_ends_at: 1.day.ago,
                              active_users_count: 10)
        allow(organization).to receive(:create_network_usage_record) do
          organization.update_attributes(active_users_count: 15)
          true
        end
        organization
      end

      it 'calls #create_network_usage_record for each Organization' do
        allow(BillingChangesMailer).to receive_message_chain(:notify, :deliver_now)
        allow(Organization).to receive(:find_each)
          .and_yield(active_user_count_does_not_change)
          .and_yield(active_user_count_goes_down)
          .and_yield(create_network_usage_record_fails)
          .and_yield(in_app_billing_disabled)
          .and_yield(within_trial_period)
          .and_yield(all_criteria_met)
        expect(active_user_count_does_not_change).to receive(:create_network_usage_record)
        expect(active_user_count_goes_down).to receive(:create_network_usage_record)
        expect(all_criteria_met).to receive(:create_network_usage_record)
        expect(create_network_usage_record_fails).to receive(:create_network_usage_record)
        expect(in_app_billing_disabled).to receive(:create_network_usage_record)
        expect(within_trial_period).to receive(:create_network_usage_record)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'does not send a notification when user count does not change' do
        allow(Organization).to receive(:find_each)
          .and_yield(active_user_count_does_not_change)
        expect(BillingChangesMailer).not_to receive(:notify)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'does not send a notification when user count goes down' do
        allow(Organization).to receive(:find_each)
          .and_yield(active_user_count_goes_down)
        expect(BillingChangesMailer).not_to receive(:notify)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'does not send a notification creating the usage record fails' do
        allow(Organization).to receive(:find_each)
          .and_yield(create_network_usage_record_fails)
        expect(BillingChangesMailer).not_to receive(:notify)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'does not send a notification when in app billing is disabled' do
        allow(Organization).to receive(:find_each)
          .and_yield(in_app_billing_disabled)
        expect(BillingChangesMailer).not_to receive(:notify)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'does not send a notification when in trial period' do
        allow(Organization).to receive(:find_each)
          .and_yield(within_trial_period)
        expect(BillingChangesMailer).not_to receive(:notify)
        NetworkCreateUsageRecordWorker.new.perform
      end

      it 'send a notification when all criteria are met' do
        mailer = double
        allow(mailer).to receive(:deliver_now)
        allow(Organization).to receive(:find_each)
          .and_yield(all_criteria_met)
        expect(BillingChangesMailer).to receive(:notify).with(
          all_criteria_met, 5
        ).and_return(mailer)
        expect(mailer).to receive(:deliver_now)
        NetworkCreateUsageRecordWorker.new.perform
      end
    end
  end
end
