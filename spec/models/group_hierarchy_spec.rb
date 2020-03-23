require 'rails_helper'

RSpec.describe GroupHierarchy, type: :model do
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

  describe 'associations' do
    it { should belong_to :parent_group }
    it { should belong_to :subgroup }
  end

  describe 'validations' do
    describe '#unique_parent_subgroup_path' do
      let(:group_hierarchy_dupe) do
        build(
          :group_hierarchy,
          parent_group: parent_group,
          path: [parent_group, subgroup].map(&:id),
          subgroup: subgroup,
        )
      end

      it 'should return errors if hierarchy already exists' do
        # persist this one first
        group_hierarchy
        # now should get an error
        expect(group_hierarchy_dupe.save).to eq false
        expect(group_hierarchy_dupe.errors[:path]).to eq ['must be unique']
      end
    end
  end

  describe 'methods' do
    describe '.find_or_create_path' do
      it 'should return the existing path if found' do
        params = [
          parent_group_id: parent_group.id,
          path: [parent_group.id, subgroup.id],
          subgroup_id: subgroup.id,
        ]
        gh = GroupHierarchy.find_or_create_path(*params)
        # should find the same one again
        expect(GroupHierarchy.find_or_create_path(*params)).to eq gh
      end
    end

    describe '#extend_path_to' do
      context 'with a group' do
        it 'includes the parent group preceding the subgroup in the array order' do
          expect(group_hierarchy.path).to eq([parent_group, subgroup].map(&:id))
          expect(
            group_hierarchy.extend_path_to(child_group).path,
          ).to eq([parent_group, subgroup, child_group].map(&:id))
        end
      end

      context 'with another hierarchy' do
        it 'merges a child hierarchy into its own path' do
          expect(
            group_hierarchy.extend_path_to(child_hierarchy).path,
          ).to eq([parent_group, subgroup, child_group].map(&:id))
        end

        it 'should use find_or_create_path and not create duplicate paths' do
          expect {
            group_hierarchy.extend_path_to(child_hierarchy).path
          }.to change(GroupHierarchy, :count).by(3)
          # second call shouldn't do anything
          expect {
            group_hierarchy.extend_path_to(child_hierarchy).path
          }.not_to change(GroupHierarchy, :count)
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
