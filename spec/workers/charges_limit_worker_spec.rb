require 'rails_helper'

RSpec.describe ChargesLimitWorker, type: :worker do
  describe '#perform' do
    let!(:in_app_billing_disabled) do
      create(:organization,
             in_app_billing: false,
             active_users_count: ChargesLimitWorker::LOW + 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:deactivated) do
      create(:organization,
             in_app_billing: true,
             deactivated: true,
             active_users_count: ChargesLimitWorker::LOW + 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_in_low_range_not_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::LOW + 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_in_low_range_already_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::LOW + 1,
             sent_high_charges_low_email: true,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_in_middle_range_not_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::MIDDLE + 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_in_middle_range_already_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::MIDDLE + 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: true,
             sent_high_charges_high_email: false)
    end

    let!(:users_equal_high_range_not_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::HIGH,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_equal_high_range_already_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::HIGH,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: true)
    end

    let!(:users_in_high_range_not_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::HIGH * 2,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    let!(:users_in_high_range_already_sent) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::HIGH * 2,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: true)
    end

    let!(:users_below_low_range) do
      create(:organization,
             in_app_billing: true,
             active_users_count: ChargesLimitWorker::LOW - 1,
             sent_high_charges_low_email: false,
             sent_high_charges_middle_email: false,
             sent_high_charges_high_email: false)
    end

    it 'notifies for organizations that meet the criteria' do
      mailer = double
      allow(mailer).to receive(:deliver_later)
      allow(ChargesLimitMailer).to receive(:notify).and_return(mailer)
      expect(mailer).to receive(:deliver_later).exactly(4).times

      expect(ChargesLimitMailer).not_to receive(:notify).with(in_app_billing_disabled)
      expect(ChargesLimitMailer).not_to receive(:notify).with(deactivated)
      expect(ChargesLimitMailer).to receive(:notify).with(users_in_low_range_not_sent)
      expect(ChargesLimitMailer).not_to receive(:notify).with(users_in_low_range_already_sent)
      expect(ChargesLimitMailer).to receive(:notify).with(users_in_middle_range_not_sent)
      expect(ChargesLimitMailer).not_to receive(:notify).with(users_in_middle_range_already_sent)
      expect(ChargesLimitMailer).to receive(:notify).with(users_equal_high_range_not_sent)
      expect(ChargesLimitMailer).not_to receive(:notify).with(users_equal_high_range_already_sent)
      expect(ChargesLimitMailer).to receive(:notify).with(users_in_high_range_not_sent)
      expect(ChargesLimitMailer).not_to receive(:notify).with(users_in_high_range_already_sent)
      expect(ChargesLimitMailer).not_to receive(:notify).with(users_below_low_range)

      ChargesLimitWorker.new.perform
    end
  end
end
