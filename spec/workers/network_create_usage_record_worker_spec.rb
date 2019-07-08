require 'rails_helper'

RSpec.describe NetworkCreateUsageRecordWorker, type: :worker do
  describe '#perform' do
    let!(:organization) { create(:organization_without_groups) }
    before do
      allow(RecordOrganizationUsage).to receive_message_chain(:call, :failure?)
    end

    context 'success' do
      it 'calls RecordOrganizationUsage service' do
        expect(RecordOrganizationUsage).to receive(:call).with(
          organization: organization,
        )
        NetworkCreateUsageRecordWorker.new.perform(organization.id)
      end
    end

    context 'failure' do
      before do
        allow(RecordOrganizationUsage).to receive_message_chain(:call, :failure?).and_return(true)
      end

      it 'raises an error' do
        expect(RecordOrganizationUsage).to receive(:call).with(
          organization: organization,
        )
        expect {
          NetworkCreateUsageRecordWorker.new.perform(organization.id)
        }.to raise_error(StandardError)
      end
    end
  end
end
