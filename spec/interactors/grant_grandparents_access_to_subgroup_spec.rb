require 'rails_helper'

RSpec.describe GrantGrandparentsAccessToSubgroup, type: :service do
  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:grandparent_group_a) { create(:group) }
    let(:grandparent_group_b) { create(:group) }
    let(:fake_context) { { parent_group: parent_group, subgroup: subgroup } }
    let(:service_call) { GrantGrandparentsAccessToSubgroup.call(fake_context) }

    before do
      create(
        :group_hierarchy,
        parent_group: grandparent_group_a,
        granted_by: grandparent_group_a,
        subgroup: parent_group,
      )

      create(
        :group_hierarchy,
        parent_group: grandparent_group_b,
        granted_by: grandparent_group_b,
        subgroup: parent_group,
      )
    end

    context 'when successful' do
      before { service_call }
      # describe '#success?' do
      #   it { expect(service_call.success?).to eq true }
      # end

      it 'retains relationship between parent group and subgroup' do
        expect(parent_group.parent_groups).to include(grandparent_group_a)
        expect(parent_group.parent_groups).to include(grandparent_group_b)
      end

      it 'creates a relationship between the grandparent groups and the subgroup' do
        expect(grandparent_group_a.subgroups).to include(subgroup)
        expect(grandparent_group_b.subgroups).to include(subgroup)
      end
    end

    # describe 'when it failure' do
    #   let(:service_call) { GrantGrandparentsAccessToSubgroup.call({}) }
    #   describe '#success?' do
    #     it { expect(service_call.success?).to eq false }
    #   end
    # end
  end
end
