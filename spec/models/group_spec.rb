require 'rails_helper'

RSpec.describe Group, type: :model do
  let(:organization) { create(:organization) }
  let(:group) { create(:group, organization: organization) }

  describe 'callbacks' do
    describe '#set_unique_handle' do
      let!(:group_2) do
        create(:group, organization: organization, handle: group.handle)
      end

      it 'automatically generates unique handle' do
        expect(group_2.handle).to eq(group.handle + '-1')
      end
    end

    describe '#setup_user_organization_memberships' do
      let(:group) { create(:group, organization: nil, network_id: '99') }

      context 'with no org change' do
        it 'does not call OrganizationMembershipWorker' do
          expect(OrganizationMembershipWorker).not_to receive(:perform_async)
          group.update(name: 'Lala')
        end
      end
      context 'going from nil org_id to org being present' do
        it 'calls OrganizationMembershipWorker' do
          expect(OrganizationMembershipWorker).to receive(:perform_async).with(
            group.user_ids,
            organization.id,
          )
          group.update(organization_id: organization.id)
        end
      end
    end
  end

  it 'should create a group shared collection' do
    expect(group.current_shared_collection).to be_truthy
  end

  context 'associations' do
    it { should belong_to :filestack_file }
    it { should have_many :group_hierarchies }
    it { should have_many :subgroups }
    it { should have_many :subgroup_memberships }
    it { should have_many :parent_groups }

    context 'with GroupHierarchy' do
      let(:group1_users) { create_list(:user, 2) }
      let(:group2_users) { create_list(:user, 2) }
      let(:group3_users) { create_list(:user, 3) }
      let!(:group1) { create(:group, add_members: group1_users, add_subgroups: [group2, group3]) }
      let!(:group2) { create(:group, add_members: group2_users, add_subgroups: [group3]) }
      let!(:group3) { create(:group, add_members: group3_users) }

      describe '#parent_groups' do
        it 'returns associated parent groups' do
          expect(group3.parent_groups).to include(group1)
          expect(group3.parent_groups).to include(group2)
          expect(group1.parent_groups).to be_empty
        end
      end

      describe '#subgroups' do
        it 'returns associated subgroups' do
          expect(group1.subgroups).to include(group2)
          expect(group1.subgroups).to include(group3)
          expect(group2.subgroups).to include(group3)
          expect(group3.subgroups).to be_empty
        end
      end

      describe '#user_ids' do
        it 'should return the user_ids of the group itself and subgroups' do
          expect(group1.user_ids).to match_array(
            (group1_users + group2_users + group3_users).pluck(:id),
          )
          expect(group2.user_ids).to match_array(
            (group2_users + group3_users).pluck(:id),
          )
          expect(group3.user_ids).to match_array(
            group3_users.pluck(:id),
          )
        end
      end
    end
  end

  context 'is primary group' do
    before do
      organization.primary_group_id = group.id
    end

    context 'after update' do
      before do
        group.update(name: '12345')
      end

      it 'should update the organization name', :vcr do
        expect(organization.name).to eq('12345')
      end
    end
  end

  context 'with users in roles' do
    let!(:admins) { create_list(:user, 3) }
    let!(:members) { create_list(:user, 3) }

    before do
      admins.each { |admin| admin.add_role(Role::ADMIN, group) }
      members.each { |member| member.add_role(Role::MEMBER, group) }
    end

    describe '#admins' do
      it 'should have all admins' do
        expect(group.admins[:users]).to match_array(admins)
      end
    end

    describe '#members' do
      it 'should have all members' do
        expect(group.members[:users]).to match_array(members)
      end
    end
  end

  describe '.viewable_in_org' do
    let!(:in_org_groups) { create_list(:group, 2, organization: organization) }
    let!(:other_org_groups) { create_list(:group, 2) }
    let!(:global_group) { create(:global_group, organization: nil) }

    it 'should include global groups and org groups' do
      # 3 org groups (admin, primary, guest), 2 more groups, 1 global group
      expect(Group.viewable_in_org(organization.id).count).to eq 6
      expect(Group.count).to eq 8
    end
  end

  describe '#archive!' do
    let(:members) { create_list(:users, 3) }
    let(:collection) { create(:collection, organization: organization) }

    before do
      group.add_role(Role::EDITOR, collection)
    end

    it 'removes the group from the collection' do
      expect(collection.editors[:groups]).to include(group)
      group.archive!
      expect(group.archived?).to be true
      expect(collection.editors[:groups]).to be_empty
    end
  end
end
