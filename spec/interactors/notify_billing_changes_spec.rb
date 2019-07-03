require 'rails_helper'

RSpec.describe NotifyBillingChanges, type: :service do
  let(:organization) { create(:organization_without_groups, active_users_count: active_users_count) }
  let(:active_users_initial_count) { 10 }
  let(:billable_users_count) { 10 }
  let(:active_users_count) { 20 }
  subject(:context) do
    NotifyBillingChanges.call(
      organization: organization,
      active_users_initial_count: active_users_initial_count,
      billable_users_count: billable_users_count,
    )
  end

  describe '#call' do
    before do
      allow(BillingChangesMailer).to receive_message_chain(:notify, :deliver_later)
    end

    context 'with billable users' do
      let(:billable_users_count) { 10 }

      context 'with an increase in active users' do
        let(:active_users_count) { 15 }
        let(:active_users_initial_count) { 10 }

        it 'calls the BillingChangesMailer' do
          expect(BillingChangesMailer).to receive(:notify).with(
            organization.id,
            5,
          )
          expect(context).to be_a_success
        end
      end

      context 'without an increase in active users' do
        let(:active_users_count) { 9 }
        let(:active_users_initial_count) { 10 }

        it 'does not call the BillingChangesMailer' do
          expect(BillingChangesMailer).not_to receive(:notify)
          expect(context).to be_a_success
        end
      end
    end

    context 'with zero billable users' do
      let(:billable_users_count) { 0 }

      it 'does not call the BillingChangesMailer' do
        expect(BillingChangesMailer).not_to receive(:notify)
        expect(context).to be_a_success
      end
    end
  end
end
