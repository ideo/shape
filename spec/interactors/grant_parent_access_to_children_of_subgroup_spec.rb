require 'rails_helper'

RSpec.describe GrantParentAccessToChildrenOfSubgroup, type: :service do
  describe '#call' do
    let!(:child_group_a) { create(:group) }
    let!(:child_group_b) { create(:group) }
    let!(:subgroup) { create(:group, add_subgroups: [child_group_a, child_group_b]) }
    let!(:parent_group) { create(:group) }
    let(:new_hierarchy) do
      create(
        :group_hierarchy,
        parent_group: parent_group,
        subgroup: subgroup,
      )
    end
    let!(:grandparent_group) { create(:group, add_subgroups: [parent_group]) }

    let(:fake_context) do
      { parent_group: parent_group, subgroup: subgroup, new_hierarchy: new_hierarchy }
    end
    let(:service_call) { GrantParentAccessToChildrenOfSubgroup.call(fake_context) }

    context 'when successful' do
      before { service_call }

      it 'retains relationship between parent group and subgroup' do
        expect(parent_group.subgroups).to include(subgroup)
      end

      it 'retains relationships between subgroup and child groups' do
        expect(subgroup.subgroups).to include(child_group_a)
        expect(subgroup.subgroups).to include(child_group_b)
      end

      it 'creates a relationship between the parent group and children of the subgroup' do
        expect(parent_group.subgroups).to include(child_group_a)
        expect(parent_group.subgroups).to include(child_group_b)
      end

      it 'connects ancestors of the parent group to children of the subgroup' do
        expect(grandparent_group.subgroups).to include(child_group_a)
        expect(grandparent_group.subgroups).to include(child_group_b)
        expect(grandparent_group.subgroups).to include(subgroup)
      end
    end

    context 'if child group adds grandparent as it`s subgroup' do
      let(:adding_grandparent_as_child) do
        GrantParentAccessToChildrenOfSubgroup.call(
          parent_group: child_group_a,
          subgroup: subgroup,
          new_hierarchy: create(
            :group_hierarchy,
            parent_group: child_group_a,
            subgroup: subgroup,
          )
        )
      end

      it 'does not run into an infinite loop' do
        debugger
      end
    end
  end
end
