require 'rails_helper'

RSpec.describe CreateOrgWideDatasets, type: :worker do
  describe '#perform' do
    let(:organization) { create(:organization) }

    it 'calls Dataset::OrgWideQuestion.find_or_create_for_organization' do
      expect(Dataset::OrgWideQuestion).to receive(:find_or_create_for_organization)
      CreateOrgWideDatasets.new.perform(organization.id)
    end
  end
end
