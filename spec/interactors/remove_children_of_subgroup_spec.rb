require 'rails_helper'

RSpec.describe RemoveChildrenOfSubgroup, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:child_group_a) { create(:group) }
    let(:child_group_b) { create(:group) }
    let(:interactor) do
      RemoveChildrenOfSubgroup.call(subgroup: subgroup, parent_group: parent_group)
    end

    context 'when successful' do
      before do
        GroupHierarchy.create(
          parent_group: parent_group,
          granted_by: parent_group,
          subgroup: subgroup,
        )

        GroupHierarchy.create(
          parent_group: subgroup,
          granted_by: subgroup,
          subgroup: child_group_a,
        )

        GroupHierarchy.create(
          parent_group: subgroup,
          granted_by: subgroup,
          subgroup: child_group_b,
        )
      end
      describe '#success?' do
        it { expect(interactor.success?).to eq true }
      end

      it 'retains relationship between parent group and subgroup' do
        expect(subgroup.parent_groups).to include(parent_group)
        expect(parent_group.subgroups).to include(subgroup)
      end

      it 'destroys relationships between the subgroup and its children' do
        expect { interactor }.to change { GroupHierarchy.count }.from(3).to(1)
        expect(subgroup.subgroups).to be_empty

        expect(parent_group.subgroups).to_not include(child_group_a)
        expect(parent_group.subgroups).to_not include(child_group_b)
      end
    end

    # Not sure how to test failure case since we do not context.fail! out of it
  end
end
