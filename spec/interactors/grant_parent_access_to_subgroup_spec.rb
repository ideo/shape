require 'rails_helper'

RSpec.describe GrantParentAccessToSubgroup, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:fake_context) { { parent_group: parent_group, subgroup: subgroup } }
    let(:grant_access_service) { GrantParentAccessToSubgroup.call(fake_context) }

    context 'when successful' do
      describe '#success?' do
        it { expect(grant_access_service.success?).to eq true }
      end

      it 'creates a relationship between the parent group and subgroup' do
        expect { grant_access_service }.to change { GroupHierarchy.count }.by(1)
        expect(subgroup.parent_groups).to include(parent_group)
      end
    end

    describe 'when it failure' do
      let(:grant_access_service) { GrantParentAccessToSubgroup.call({}) }
      describe '#success?' do
        it { expect(grant_access_service.success?).to eq false }
      end
    end
  end
end
