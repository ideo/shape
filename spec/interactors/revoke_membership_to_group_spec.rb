require 'rails_helper'

RSpec.describe RevokeMembershipToGroup, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:interactor) { RevokeMembershipToGroup.call(subgroup: subgroup, parent_group: parent_group) }


    context 'when successful' do
      before do
        GroupHierarchy.create(
          parent_group: parent_group,
          granted_by: parent_group,
          subgroup: subgroup,
        )
      end
      describe '#success?' do
        it { expect(interactor.success?).to eq true }
      end

      it 'destroys relationship between the parent group and subgroup' do
        expect { interactor }.to change { GroupHierarchy.count }.from(1).to(0)
        expect(subgroup.parent_groups).to be_empty
        expect(parent_group.subgroups).to be_empty
      end
    end

    describe 'when it fails' do
      let(:interactor) { RevokeMembershipToGroup.call({}) }
      describe '#success?' do
        it { expect(interactor.success?).to eq false }
      end
    end
  end
end
