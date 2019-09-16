require 'rails_helper'

RSpec.describe GroupHierarchy, type: :model do
  describe 'associations' do
    it { should belong_to :parent_group }
    it { should belong_to :subgroup }
  end

  describe 'methods' do
    let(:parent_group) { create(:group) }
    let(:subgroup) { create(:group) }

    let(:group_hierarchy) do
      create(
        :group_hierarchy,
        parent_group: parent_group,
        path: [parent_group, subgroup].map(&:id),
        subgroup: subgroup,
      )
    end
    let(:child_group) { create(:group) }
    let(:child_hierarchy) do
      create(
        :group_hierarchy,
        parent_group: subgroup,
        path: [subgroup, child_group].map(&:id),
        subgroup: child_group,
      )
    end

    describe '#extend_path_to' do
      context 'with a group' do
        it 'includes the parent group preceding the subgroup in the array order' do
          expect(group_hierarchy.path).to eq([parent_group, subgroup].map(&:id))
          expect(
            group_hierarchy.extend_path_to(child_group).path
          ).to eq([parent_group, subgroup, child_group].map(&:id))
        end
      end

      context 'with another hierarchy' do
        it 'merges a child hierarchy into its own path' do
          expect(
            group_hierarchy.extend_path_to(child_hierarchy).path
          ).to eq([parent_group, subgroup, child_group].map(&:id))
        end
      end
    end

    describe '#set_default_path' do
      let(:no_path_hierarchy) { create(:group_hierarchy, parent_group: parent_group, subgroup: subgroup) }

      it 'makes a path between parent group and subgroup if no path provided' do
        expect(no_path_hierarchy.path).to eq([parent_group, subgroup].map(&:id))
      end
    end
  end
end
