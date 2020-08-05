require 'rails_helper'

RSpec.describe MarkAsOverdueWorker, type: :worker do
  describe '#perform' do
    let(:over_trial_user_count) { Organization::DEFAULT_TRIAL_USERS_COUNT + 5 }
    let(:under_trial_user_count) { Organization::DEFAULT_TRIAL_USERS_COUNT - 5 }
    let(:over_freemium_user_count) { Organization::FREEMIUM_USER_LIMIT + 2 }
    let(:under_freemium_user_count) { Organization::FREEMIUM_USER_LIMIT - 2 }

    let(:in_app_billing) { false }
    let(:billable) { true }
    let(:deactivated) { false }
    let(:trial_ends_at) { 1.week.ago }
    let(:has_payment_method) { false }
    let(:active_users_count) { over_trial_user_count }
    let(:trial_users_count) { Organization::DEFAULT_TRIAL_USERS_COUNT }
    let(:overdue_at) { nil }
    let!(:org) do
      create(:organization,
             in_app_billing: in_app_billing,
             billable: billable,
             deactivated: deactivated,
             trial_ends_at: trial_ends_at,
             has_payment_method: has_payment_method,
             active_users_count: active_users_count,
             trial_users_count: trial_users_count,
             overdue_at: overdue_at,
            )
    end

    before do
      MarkAsOverdueWorker.new.perform
    end

    context 'in app billing disabled' do
      let(:in_app_biling) { false }
      let(:billable) { false }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'deactivated' do
      let(:deactivated) { true }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'has payment method' do
      let(:has_payment_method) { true }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'already set as overdue' do
      let(:overdue_at) { 1.week.ago }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'has not exceeded the user count within trial' do
      let(:active_users_count) { under_trial_user_count }
      let(:billable) { false }
      let(:trial_ends_at) { 1.week.from_now }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'no trial and has not exceeded freemium limit' do
      let(:active_users_count) { under_freemium_user_count }
      let(:billable) { false }
      let(:trial_ends_at) { nil }
      let(:trial_users_count) { 0 }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'trial ended but has not exceeded the freemium limit' do
      let(:active_users_count) { under_freemium_user_count }
      let(:billable) { false }
      let(:trial_ends_at) { 1.week.ago }
      let(:trial_users_count) { 0 }

      it 'should not change overdue' do
        expect { org.reload }.not_to(change { org.overdue_at.try(:round) })
      end
    end

    context 'trial ended but has not exceeded the freemium limit' do
      let(:active_users_count) { over_trial_user_count }
      let(:trial_ends_at) { 1.week.ago }
      let(:trial_users_count) { Organization::DEFAULT_TRIAL_USERS_COUNT }

      it 'should change overdue' do
        expect { org.reload }.to(change { org.overdue_at.try(:round) })
        expect(org.overdue_at).to be_within(5.seconds).of Time.current
      end
    end

    context 'trial ended over freemium limit' do
      let(:active_users_count) { over_freemium_user_count }
      let(:trial_ends_at) { 1.week.ago }
      let(:trial_users_count) { Organization::DEFAULT_TRIAL_USERS_COUNT }

      it 'should change overdue' do
        expect { org.reload }.to(change { org.overdue_at.try(:round) })
        expect(org.overdue_at).to be_within(5.seconds).of Time.current
      end
    end
  end
end
