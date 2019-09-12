require 'rails_helper'

RSpec.describe GrantParentAccessToChildrenOfSubgroup, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:group_a) { create(:group) }
    let(:group_b) { create(:group) }
    let(:fake_context) { { parent_group: parent_group, subgroup: subgroup } }
    let(:service_call) { GrantParentAccessToChildrenOfSubgroup.call(fake_context) }

    before do
      create(
        :group_hierarchy,
        parent_group: parent_group,
        granted_by: parent_group,
        subgroup: subgroup,
      )

      create(
        :group_hierarchy,
        parent_group: subgroup,
        granted_by: subgroup,
        subgroup: group_a,
      )

      create(
        :group_hierarchy,
        parent_group: subgroup,
        granted_by: subgroup,
        subgroup: group_b,
      )
    end

    context 'when successful' do
      before { service_call }
      # describe '#success?' do
      #   it { expect(service_call.success?).to eq true }
      # end
      it 'retains relationship between parent group and subgroup' do
        expect(parent_group.subgroups).to include(subgroup)
      end

      it 'retains relationships between subgroup and child groups' do
        expect(subgroup.subgroups).to include(group_a)
        expect(subgroup.subgroups).to include(group_b)
      end

      it 'creates a relationship between the parent group and children of the subgroup' do
        expect(parent_group.subgroups).to include(group_a)
        expect(parent_group.subgroups).to include(group_b)
      end
    end

    # describe 'when it failure' do
    #   let(:service_call) { GrantParentAccessToSubgroup.call({}) }
    #   describe '#success?' do
    #     it { expect(service_call.success?).to eq false }
    #   end
    # end
  end
end
