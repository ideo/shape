require 'rails_helper'

RSpec.describe RemoveGrandparentToChildGroupRelations, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:grand_parent_group) { create(:group) }
    let(:child_group_a) { create(:group) }
    let(:child_group_b) { create(:group) }
    let(:interactor) do
      RemoveGrandparentToChildGroupRelations.call(subgroup: subgroup, parent_group: parent_group)
    end

    context 'when successful' do
      before do
        GroupHierarchy.create(
          parent_group: parent_group,
          path: [parent_group.id, subgroup.id],
          subgroup: subgroup,
        )

        GroupHierarchy.create(
          parent_group: subgroup,
          path: [subgroup.id, child_group_a.id],
          subgroup: child_group_a,
        )

        GroupHierarchy.create(
          parent_group: subgroup,
          path: [subgroup.id, child_group_b.id],
          subgroup: child_group_b,
        )

        GroupHierarchy.create(
          parent_group: parent_group,
          path: [parent_group.id, subgroup.id, child_group_a.id],
          subgroup: child_group_a,
        )

        GroupHierarchy.create(
          parent_group: parent_group,
          path: [parent_group.id, subgroup.id, child_group_b.id],
          subgroup: child_group_b,
        )

        GroupHierarchy.create(
          parent_group: grand_parent_group,
          path: [grand_parent_group.id, parent_group.id, subgroup.id],
          subgroup: subgroup,
        )

        GroupHierarchy.create(
          parent_group: grand_parent_group,
          path: [grand_parent_group.id, parent_group.id, subgroup.id, child_group_a.id],
          subgroup: child_group_a,
        )

        GroupHierarchy.create(
          parent_group: grand_parent_group,
          path: [grand_parent_group.id, parent_group.id, subgroup.id, child_group_b.id],
          subgroup: child_group_b,
        )
      end
      describe '#success?' do
        it { expect(interactor.success?).to eq true }
      end

      it 'destroys relationships between ancestors of the subgroup and children of subgroup' do
        expect { interactor }.to change { GroupHierarchy.count }.from(8).to(2)

        expect(subgroup.subgroups).to include(child_group_a)
        expect(subgroup.subgroups).to include(child_group_b)

        expect(parent_group.subgroups).to_not include(child_group_a)
        expect(parent_group.subgroups).to_not include(child_group_b)
        expect(grand_parent_group.subgroups).to_not include(child_group_a)
        expect(grand_parent_group.subgroups).to_not include(child_group_b)
      end
    end

    # Not sure how to test failure case since we do not context.fail! out of it
  end
end
