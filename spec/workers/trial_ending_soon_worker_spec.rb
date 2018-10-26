require 'rails_helper'

RSpec.describe TrialEndingSoonWorker, type: :worker do
  let!(:network_organization) { double('network_organization', id: 123) }
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             trial_ends_at: 7.days.from_now)
    end
    let!(:trial_ended_2_days_ago) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 2.day.ago)
    end
    let!(:trial_ends_in_1_day) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.day.from_now)
    end
    let!(:trial_ends_in_2_days) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 2.days.from_now)
    end
    let!(:trial_ends_in_3_days) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 3.days.from_now)
    end
    let!(:trial_ends_in_1_week) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 1.week.from_now)
    end
    let!(:trial_ends_in_2_weeks) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 2.weeks.from_now)
    end
    let!(:trial_ends_in_3_weeks) do
      create(:organization,
             in_app_billing: true,
             trial_ends_at: 3.weeks.from_now)
    end

    context 'payment method exists' do
      before do
        allow_any_instance_of(Organization).to receive(:network_organization).and_return(network_organization)
        allow(NetworkApi::PaymentMethod).to receive(:find)
          .with(organization_id: network_organization.id)
          .and_return(['something'])
      end

      it 'does not send any notices' do
        expect(TrialEndingSoonMailer).not_to receive(:notify)
        TrialEndingSoonWorker.new.perform
      end
    end

    context 'payment method does not exist' do
      before do
        allow_any_instance_of(Organization).to receive(:network_organization).and_return(network_organization)
        allow(NetworkApi::PaymentMethod).to receive(:find)
          .with(organization_id: network_organization.id)
          .and_return([])
      end
      it 'sends notices to organizations that meet the criteria' do
        expect(TrialEndingSoonMailer).to receive(:notify).with(
          trial_ends_in_2_days, 2
        )
        expect(TrialEndingSoonMailer).to receive(:notify).with(
          trial_ends_in_1_week, 7
        )
        expect(TrialEndingSoonMailer).to receive(:notify).with(
          trial_ends_in_2_weeks, 14
        )
        expect(TrialEndingSoonMailer).not_to receive(:notify).with(in_app_billing_disabled)
        expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ended_2_days_ago)
        expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_1_day)
        expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_3_days)
        expect(TrialEndingSoonMailer).not_to receive(:notify).with(trial_ends_in_3_weeks)
        TrialEndingSoonWorker.new.perform
      end
    end
  end
end
