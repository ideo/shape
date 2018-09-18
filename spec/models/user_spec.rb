require 'rails_helper'

describe User, type: :model do
  let!(:user) { create(:user) }

  context 'associations' do
    it { should belong_to :current_organization }
    it { should belong_to :current_user_collection }
    it { should have_many :collections }
    it { should have_many :groups }
    it { should have_many :current_org_groups }
    it { should have_many :organizations }
    it { should have_many :comments }
    it { should have_many :activities_as_actor }
    it { should have_many :notifications }
  end

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:uid).scoped_to(:provider) }
  end

  context 'callbacks' do
    let!(:org) { create(:organization) }
    let(:org_group) { org.guest_group }
    let!(:org_2) { create(:organization) }
    let(:org_2_group) { org_2.guest_group }

    describe '#after_add_role' do
      it 'should reset cached roles and reindex user' do
        expect(user).to receive(:reset_cached_roles!)
        user.add_role(Role::MEMBER, org_group)
      end

      it 'should reindex user if added to primary group' do
        expect(user).to receive(:reindex)
        user.add_role(Role::MEMBER, org.primary_group)
      end

      context 'with a user being added to admin group' do
        before do
          user.add_role(Role::ADMIN, org.primary_group)
        end

        it 'should add the user as an admin to the primary group' do
          expect(user.has_role?(Role::ADMIN, org.admin_group)).to be true
        end
      end

      context 'with a user being added as admin to primary group' do
        before do
          user.add_role(Role::ADMIN, org.primary_group)
        end

        it 'should add the user as an admin to the admin group' do
          expect(user.has_role?(Role::ADMIN, org.admin_group)).to be true
        end
      end
    end

    describe '#update_profile_names' do
      let!(:profile) { create(:user_profile, created_by: user, name: 'My Profile') }

      it 'should update all UserProfiles to match user name' do
        user.reload # pick up user_profiles relation
        user.update(first_name: 'Bill', last_name: 'Hader')
        expect(profile.reload.name).to eq 'Bill Hader'
      end
    end
  end

  describe '#add_role' do
    let(:collection) { create(:collection) }

    it 'adds role' do
      expect(user.add_role(Role::EDITOR, collection).persisted?).to be true
      expect(user.has_role?(Role::EDITOR, collection)).to be true
    end

    context 'with another user' do
      let(:user_2) { create(:user) }

      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'adds role' do
        expect(user_2.add_role(Role::EDITOR, collection).persisted?).to be true
        expect(user_2.has_role?(Role::EDITOR, collection)).to be true
      end

      it 'does not duplicate role' do
        expect do
          user_2.add_role(Role::EDITOR, collection)
        end.not_to change(collection.roles, :count)
      end
    end

    context 'with another group' do
      let!(:group) { create(:group) }

      before do
        group.add_role(Role::EDITOR, collection)
      end

      it 'adds role' do
        expect(group.has_role?(Role::EDITOR, collection)).to be true
      end

      it 'does not duplicate role' do
        expect do
          group.add_role(Role::EDITOR, collection)
        end.not_to change(Role, :count)
      end
    end
  end

  describe '.from_omniauth' do
    let(:pending_user) { nil }
    let(:auth) do
      Hashie::Mash.new(
        provider: 'ideo',
        uid: '123',
        info: {
          email: Faker::Internet.unique.email,
          first_name: Faker::Name.first_name,
          last_name: Faker::Name.last_name,
          image: 'http://pic.url.net',
        },
        extra: {
          raw_info: {
            picture: 'http://pic.url.net',
            picture_medium: 'http://pic.url.net/med',
            picture_large: 'http://pic.url.net/lg',
          },
        },
      )
    end
    let(:from_omniauth) { User.from_omniauth(auth, pending_user) }

    context 'with existing user' do
      let!(:existing_user) { create(:user, provider: 'ideo', uid: '123') }

      it 'updates existing user if found' do
        expect(from_omniauth.id).to eq existing_user.id
        expect(from_omniauth.email).to eq auth.info.email
        expect(from_omniauth.first_name).to eq auth.info.first_name
        expect(from_omniauth.last_name).to eq auth.info.last_name
        expect(from_omniauth.picture).to eq auth.extra.raw_info.picture
        expect(from_omniauth.picture_medium).to eq auth.extra.raw_info.picture_medium
        expect(from_omniauth.picture_large).to eq auth.extra.raw_info.picture_large
      end
    end

    context 'with pending user' do
      let!(:pending_user) { create(:user) }

      it 'updates existing user if found' do
        expect(from_omniauth.id).to eq pending_user.id
        expect(from_omniauth.email).to eq auth.info.email
      end
    end

    context 'with pending user found via email' do
      let!(:email_matching_user) { create(:user, :pending, email: auth.info.email) }

      it 'finds matching user' do
        expect(from_omniauth.id).to eq email_matching_user.id
      end
    end

    context 'without existing user' do
      it 'sets up new user record' do
        expect(from_omniauth.new_record?).to be true
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

    it 'should include name, email, handle, organization_ids' do
      expect(user.search_data).to eq(
        name: user.name,
        email: user.email,
        handle: user.handle,
        organization_ids: [],
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
      user = User.create_pending_user(email: email)
      user.update_attributes(email: email.upcase)
      expect(user.email).to eq(email.downcase)
    end
  end

  describe '#current_org_groups_roles_identifiers' do
    let!(:user) { create(:user) }
    let(:organization) { create(:organization, member: user) }
    let(:group) { create(:group, organization: organization) }
    let(:collection) { create(:collection) }
    let(:item) { create(:text_item) }

    before do
      user.add_role(Role::MEMBER, group)
      group.add_role(Role::EDITOR, collection)
      group.add_role(Role::VIEWER, item)
    end

    it 'should include all group role identifiers' do
      expect(group.roles_to_resources.size).to eq(2)
      expect(user.current_org_groups_roles_identifiers).to eq(group.roles_to_resources.map(&:identifier))
    end
  end

  context 'loading current organization groups' do
    let!(:org) { create(:organization, member: user) }
    let!(:org_2) { create(:organization) }
    let!(:group_in_org_member) do
      create(:group,
             organization: user.current_organization,
             add_members: [user])
    end
    let!(:group_in_org_not_member) do
      create(:group, organization: user.current_organization)
    end
    let!(:group_not_in_org) do
      create(:group,
             organization: org_2,
             add_members: [user])
    end

    describe '#current_org_groups' do
      it 'only returns groups this user is a member of in current org' do
        expect(user.has_role?(Role::MEMBER, group_in_org_member)).to be true
        expect(user.has_role?(Role::MEMBER, org.primary_group)).to be true
        expect(user.has_role?(Role::MEMBER, group_in_org_not_member)).to be false
        expect(user.has_role?(Role::MEMBER, group_not_in_org)).to be true
        expect(user.current_org_groups).to match_array([group_in_org_member, org.primary_group])
      end
    end

    describe '#current_org_groups_and_special_groups' do
      let(:admin) { create(:user) }
      let(:guest) { create(:user) }
      let!(:org) { create(:organization, member: user, guest: guest, admin: admin) }

      it 'does not allow guest to see their own guest group' do
        expect(guest.current_org_groups_and_special_groups).to match_array([])
      end

      it 'allows access to the guest group for org members' do
        expect(user.current_org_groups_and_special_groups).to match_array([group_in_org_member, org.primary_group, org.guest_group])
        expect(admin.current_org_groups_and_special_groups).to match_array([org.primary_group, org.guest_group, org.admin_group])
      end

      context 'with super admin role' do
        let(:super_admin) { create(:user, :super_admin, add_to_org: org) }

        it 'shows all org groups' do
          # 3 org groups and 2 more groups created above
          expect(super_admin.current_org_groups_and_special_groups.length).to be 5
        end
      end
    end
  end

  describe '#switch_to_organization' do
    let(:user) { create(:user) }
    let!(:organization) { create(:organization) }
    let!(:org_user_collection) do
      # Create user collection manually
      # To make sure being in an org isn't coupled with being a group member/admin
      Collection::UserCollection.find_or_create_for_user(user, organization)
    end

    it 'sets current_organization' do
      expect(user.current_organization).to be_nil
      expect(user.switch_to_organization(organization)).to be_truthy
      expect(user.current_organization).to eq(organization)
    end

    it 'sets current_user_collection' do
      expect(user.current_user_collection).to be_nil
      expect(user.switch_to_organization(organization)).to be_truthy
      expect(user.current_user_collection).to eq(org_user_collection)
    end

    context 'if setting to nil' do
      before do
        user.switch_to_organization(organization)
      end

      it 'sets current_organization to nil' do
        expect(user.current_organization).not_to be_nil
        user.switch_to_organization(nil)
        expect(user.current_organization).to be_nil
      end

      it 'sets current_user_collection to nil' do
        expect(user.current_user_collection).not_to be_nil
        expect(user.switch_to_organization(nil)).to be_truthy
        expect(user.current_user_collection).to be_nil
      end
    end
  end

  context 'abilities for viewing and editing' do
    let(:ability) { Ability.new(user) }
    let(:collection) { create(:collection) }
    before do
      # in this context, this works better than `add_editors [user]`
      user.add_role(Role::EDITOR, collection)
    end

    context 'with pending user' do
      let(:user) { create(:user, status: User.statuses[:pending], terms_accepted: false) }

      it 'does not allow any access to content' do
        expect(ability).not_to be_able_to(:read, collection)
      end
    end

    context 'with active user who has not accepted terms' do
      let(:user) { create(:user, terms_accepted: false) }

      it 'allows read only access to content' do
        expect(ability).not_to be_able_to(:create, Collection.new)
        expect(ability).to be_able_to(:read, collection)
        expect(ability).not_to be_able_to(:update, collection)
        expect(ability).not_to be_able_to(:destroy, collection)
      end
    end

    context 'with fully activated user' do
      let(:user) { create(:user) }

      it 'allows edit access to content' do
        expect(ability).to be_able_to(:create, Collection.new)
        expect(ability).to be_able_to(:read, collection)
        expect(ability).to be_able_to(:update, collection)
        expect(ability).to be_able_to(:destroy, collection)
      end
    end
  end
end
