require 'rails_helper'

RSpec.describe RecordOrganizationUsage, type: :service do
  let(:organization) { create(:organization_without_groups) }
  subject(:context) { RecordOrganizationUsage.call(organization: organization) }

  describe '#call' do
    it 'should call the interactors' do
      stub = double('interactor')
      allow(stub).to receive(:run!).and_return(true)
      allow(stub).to receive(:context).and_return(true)
      expect(CalculateOrganizationActiveUsers).to receive(:new).and_return(stub)
      expect(CalculateOrganizationBillableUsers).to receive(:new).and_return(stub)
      expect(CreateNetworkUsageRecord).to receive(:new).and_return(stub)
      expect(NotifyBillingChanges).to receive(:new).and_return(stub)
      expect(context).to be_a_success
    end
  end
end
