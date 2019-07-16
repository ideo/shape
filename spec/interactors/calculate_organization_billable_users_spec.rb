require 'rails_helper'

RSpec.describe CalculateOrganizationBillableUsers, type: :service do
  let(:organization) { create(:organization_without_groups) }
  subject(:context) { CalculateOrganizationBillableUsers.call(organization: organization) }

  describe '#call' do
    context 'when within trial period' do
      before { organization.update(active_users_count: active_users_count, trial_users_count: 25, trial_ends_at: 1.month.from_now) }

      context 'when active users exceeds trial users quota' do
        let(:active_users_count) { 35 }

        it 'calculates active users minus trial users quota' do
          expect(context).to be_a_success
          expect(context.billable_users_count).to eql(10)
        end
      end

      context 'when active users is less than trial users quota' do
        let(:active_users_count) { 10 }

        it 'calculates 0 billable users' do
          expect(context).to be_a_success
          expect(context.billable_users_count).to eql(0)
        end
      end
    end

    context 'when outside of trial period' do
      before { organization.update(active_users_count: active_users_count) }

      context 'when active users exceeds freemium user quota' do
        let(:active_users_count) { 10 }

        it 'calculates active users' do
          expect(context).to be_a_success
          expect(context.billable_users_count).to eql(active_users_count)
        end
      end

      context 'when active users is less than or equals freemium user quota' do
        let(:active_users_count) { 2 }

        it 'calculates 0 billable users' do
          expect(context).to be_a_success
          expect(context.billable_users_count).to eql(0)
        end
      end
    end
  end
end
