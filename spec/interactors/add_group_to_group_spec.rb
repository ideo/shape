require 'rails_helper'

RSpec.describe AddGroupToGroup, type: :service do
  # https://stackoverflow.com/questions/43984783/how-do-we-test-interactor-organizers-using-rspec
  describe '#organized' do
    it 'organizes all of the related interactors ' do
      expect(AddGroupToGroup.organized).to eq([
        GrantParentAccessToSubgroup,
        GrantParentAccessToChildrenOfSubgroup,
      ])
    end
  end

  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:interactor) { AddGroupToGroup.call(subgroup: subgroup, parent_group: parent_group) }

    it 'calls the organized interactors' do
      expect(GrantParentAccessToSubgroup).to receive(:call!).and_return(:success)
      expect(GrantParentAccessToChildrenOfSubgroup).to receive(:call!).and_return(:success)
      interactor
    end

    it 'returns a context' do
      expect(interactor).to be_kind_of(Interactor::Schema::Context)
    end

    it 'returned context is successful' do
      expect(interactor.success?).to eq true
    end

    context 'with a circular reference' do
      let!(:child_group_a) { create(:group) }
      let!(:child_group_b) { create(:group) }
      let!(:parent_group) { create(:group, add_subgroups: [child_group_a, child_group_b]) }
      let!(:grandparent_group) { create(:group, add_subgroups: [parent_group]) }
      before do
        # Make circular reference back to grandparent
        AddGroupToGroup.call(parent_group: child_group_a, subgroup: grandparent_group)
      end

      it 'when called again, does not create multiple GroupHierarchies with the same path' do
        AddGroupToGroup.call(parent_group: child_group_a, subgroup: grandparent_group)
        paths = child_group_a.group_hierarchies.pluck(:path)
        expect(paths).to match_array(paths.uniq)
      end

      it 'does not create additional group hierarchies if called again' do
        expect {
          AddGroupToGroup.call(parent_group: child_group_a, subgroup: grandparent_group)
        }.not_to change(GroupHierarchy, :count)
      end

      it 'when circular, does not repeat the path' do
        AddGroupToGroup.call(parent_group: grandparent_group, subgroup: child_group_a)
        cid = child_group_a.id
        gpid = grandparent_group.id
        pid = parent_group.id
        expect(child_group_a.group_hierarchies.pluck(:path)).to match_array(
          [
            [cid, gpid],
            [cid, gpid, cid],
            [cid, gpid, pid],
          ],
        )
      end
    end
  end
end
