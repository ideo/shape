require 'rails_helper'

describe User, type: :model do
  let!(:user) { create(:user) }

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
  end

  context 'callbacks' do
    let!(:org) { create(:organization) }
    let(:org_group) { org.primary_group }
    let!(:org_2) { create(:organization) }
    let(:org_2_group) { org_2.primary_group }

    describe '#after_add_role' do
      before do
        user.add_role(Role::MEMBER, org_group)
        user.reload
      end

      it 'should set current_organization' do
        expect(user.current_organization).to eq(org)
      end

      it 'should not override current_organization if already set' do
        user.add_role(Role::MEMBER, org_2_group)
        expect(user.reload.current_organization).to eq(org)
      end
    end

    describe '#after_remove_role' do
      before do
        user.add_role(Role::MEMBER, org_group)
      end

      it 'should set another org they belonged to as current' do
        user.add_role(Role::MEMBER, org_2_group)
        expect(user.reload.current_organization).to eq(org)

        user.remove_role(Role::MEMBER, org_group)
        expect(user.reload.current_organization).to eq(org_2)
      end

      it 'should remove current_organization if user only belonged to one' do
        user.remove_role(Role::MEMBER, org_group)
        expect(user.reload.current_organization).to  be_nil
      end
    end

    describe '#create_user_collection' do
      let(:user) { create(:user) }
      let!(:organization) { create(:organization) }
      let(:user_collections) { user.collections.user }

      before do
        user.add_role(Role::MEMBER, organization.primary_group)
      end

      it 'should create a Collection::UserCollection' do
        expect(user_collections.size).to eq(1)
        expect(user_collections[0]).to be_instance_of(Collection::UserCollection)
        expect(user_collections[0].persisted?).to be true
      end
    end
  end

  describe '#organizations' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(Role::MEMBER, organizations[0].primary_group)
      user.add_role(Role::ADMIN, organizations[1].primary_group)
    end

    it 'should return all organizations they have any role on' do
      expect(user.organizations).to match_array(organizations)
    end
  end

  describe '#name' do
    it 'should concatenate first and last name' do
      expect(user.name).to eq("#{user.first_name} #{user.last_name}")
    end

    it 'should not include spaces if first name is empty' do
      user.first_name = nil
      expect(user.name).to eq(user.last_name)
    end

    it 'should not include spaces if last name is empty' do
      user.last_name = nil
      expect(user.name).to eq(user.first_name)
    end
  end

  describe '#search_data' do
    let!(:user) { create(:user) }
    let(:organizations) { create_list(:organization, 2) }

    it 'should include name, email, organization_ids' do
      expect(user.search_data).to eq(
        {
          name: user.name,
          email: user.email,
          organization_ids: [],
        }
      )
    end

    context 'if user is member of orgs' do
      before do
        user.add_role(:member, organizations[0].primary_group)
        user.add_role(:member, organizations[1].primary_group)
      end

      it 'should have org ids' do
        expect(user.search_data[:organization_ids]).to match_array(organizations.map(&:id))
      end
    end
  end

  describe '#has_role?' do
    context 'with base role' do
      it 'is true if user has role' do
        user.add_role(:admin)
        expect(user.has_role?(:admin)).to be true
      end

      it 'is false if user does not have role' do
        expect(user.has_role?(:admin)).to be false
      end
    end

    context 'with base class object' do
      let(:object) { create(:collection) }

      it 'is true if user has role' do
        user.add_role(Role::EDITOR, object)
        expect(user.has_role?(:editor, object)).to be true
      end

      it 'is false if user does not have role' do
        expect(user.has_role?(:editor, object)).to be false
      end
    end

    context 'with STI object' do
      let(:object) { create(:text_item) }

      it 'is true if user has role' do
        user.add_role(Role::EDITOR, object)
        expect(user.has_role?(:editor, object)).to be true
      end

      it 'is fale if user does not have role' do
        expect(user.has_role?(:editor, object)).to be false
      end
    end
  end

  describe '#create_pending_user' do
    let(:email) { Faker::Internet.email }

    it 'should create a new pending user' do
      user = User.create_pending_user(email: email)
      expect(user.persisted? && user.pending?).to be true
      expect(user.email).to eq(email)
    end

    it 'should not be case sensitive' do
      user.update_attributes(email: email.upcase)
      expect(User.create_pending_user(email: email).email).to eq(email.downcase)
    end
  end

  describe '#viewable_collections_and_items' do
    let!(:organization) { create(:organization) }
    let(:org_2) { create(:organization) }

    context 'with collections' do
      let!(:view_coll) do
        create(:collection,
               add_viewers: [user],
               organization: organization)
      end
      let!(:edit_coll) do
        create(:collection,
               add_editors: [user],
               organization: organization)
      end
      let!(:other_coll) do
        create(:collection,
               organization: organization)
      end

      it 'returns all collections user has been added to' do
        expect(
          user.viewable_collections_and_items(organization),
        ).to match_array([view_coll, edit_coll])
      end

      it 'returns collections only in this org' do
        edit_coll.update_attributes(organization: org_2)
        expect(
          user.viewable_collections_and_items(organization),
        ).to match_array(*view_coll)
      end
    end

    context 'with items' do
      let!(:view_item) { create(:text_item, add_viewers: [user]) }
      let!(:edit_item) { create(:text_item, add_editors: [user]) }
      let!(:other_item) { create(:text_item) }

      it 'should return all items user has been added to' do
        expect(
          user.viewable_collections_and_items(organization)
        ).to match_array([edit_item, view_item])
      end

      pending 'it should only return items in this org' do
        # TODO: figure out how to efficiently reference org from item
        expect(
          user.viewable_collections_and_items(organization)
        ).to match_array(*view_item)
      end
    end
  end

  describe '#collection_and_group_identifiers' do
    let!(:organization) { create(:organization) }
    let(:collection) do
      create(:collection,
             add_viewers: [user],
             organization: organization)
    end
    let!(:member_group) do
      create(:group,
             add_members: [user],
             organization: organization)
    end
    let!(:admin_group) do
      create(:group,
             add_admins: [user],
             organization: organization)
    end
    let!(:other_group) do
      create(:group, organization: organization)
    end

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
      allow(user).to receive(:viewable_collections_and_items).and_return([collection])
    end

    it 'should add all groups user is member/admin of' do
      expect(user.collection_and_group_identifiers(organization)).to match_array(
        [
          member_group.resource_identifier,
          admin_group.resource_identifier,
          collection.resource_identifier,
          organization.primary_group.resource_identifier,
        ]
      )
    end

    context 'if user is not member of primary group' do
      # We chose to do this because you should be able to 'see' anyone
      # who is an admin or member of the org
      it 'should include primary group even if user is not a member' do
        user.remove_role(Role::MEMBER, organization.primary_group)
        expect(organization.primary_group.can_view?(user)).to be false
        expect(
          user.collection_and_group_identifiers(organization)
        ).to include(organization.primary_group.resource_identifier)
      end
    end
  end

  describe '#users_through_collections_items_and_groups' do
    let!(:organization) { create(:organization) }
    let!(:users) { create_list(:user, 4) }

    context 'when added to collections' do
      let!(:view_coll) do
        create(:collection,
               add_viewers: [user, users[0]],
               organization: organization,
              )
      end
      let!(:edit_coll) do
        create(:collection,
               add_editors: [user, users[1]],
               add_viewers: [users[2]],
               organization: organization,
              )
      end
      let!(:other_coll) do
        create(:collection,
               add_editors: [users[3]])
      end

      it 'returns all users of collections they are editor/viewer of' do
        expect(user.users_through_collections_items_and_groups(organization)).to match_array(
          [
            users[0],
            users[1],
            users[2],
          ]
        )
      end
    end

    context 'when added to groups' do
      let!(:edit_group) do
        create(:group,
               add_admins: [user, users[0]],
               organization: organization)
      end
      let!(:member_group) do
        create(:group,
               add_admins: [users[2]],
               add_members: [user, users[1]],
               organization: organization)
      end

      it 'returns users from all groups they are member/admin of' do
        expect(user.users_through_collections_items_and_groups(organization)).to match_array(
          [
            users[0],
            users[1],
            users[2],
          ]
        )
      end
    end
  end

  describe '#current_org_groups_roles_identifiers' do
    let(:organization) { create(:organization) }
    let(:group) { create(:group, organization: organization) }
    let(:collection) { create(:collection) }
    let(:item) { create(:text_item) }
    let!(:user) { create(:user) }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
      user.add_role(Role::MEMBER, group)
      group.add_role(Role::EDITOR, collection)
      group.add_role(Role::VIEWER, item)
    end

    it 'should include all group role identifiers' do
      expect(group.roles.size).to eq(2)
      expect(user.current_org_groups_roles_identifiers).to eq(group.roles.map(&:identifier))
    end
  end
end
