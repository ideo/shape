require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  context 'associations' do
    it { should have_many :collections }
    it { should have_many :groups }
    it { should belong_to :primary_group }

    describe '#destroy' do
      let!(:organization) { create(:organization) }
      let!(:collection_list) { create_list(:collection, 2, organization: organization, num_cards: 3) }
      let(:collections) { organization.collections }
      let(:items) { organization.items }

      it 'should destroy all related cards and items' do
        expect(collections.count).to be >= 2
        expect(items.count).to eq 6
        organization.destroy
        expect(collections.count).to eq 0
        expect(items.count).to eq 0
      end
    end
  end

  context 'callbacks' do
    let(:organization) { create(:organization) }

    describe '#initialize_primary_group' do
      it 'should create primary group with same name as org' do
        expect(organization.primary_group.persisted?).to be true
        expect(organization.primary_group.name).to eq(organization.name)
        expect(organization.primary_group.handle).to eq(organization.name.parameterize)
      end
    end

    describe '#initialize_guest_group' do
      it 'should create guest group with same name as org + Guests' do
        expect(organization.guest_group.persisted?).to be true
        expect(organization.guest_group.name).to eq("#{organization.name} Guests")
        expect(organization.guest_group.handle).to eq("#{organization.name.parameterize}-guest")
      end
    end

    describe '#initialize_admin_group' do
      it 'should create admin group with same name as org + Admins' do
        expect(organization.admin_group.persisted?).to be true
        expect(organization.admin_group.name).to eq("#{organization.name} Admins")
        expect(organization.admin_group.handle).to eq("#{organization.name.parameterize}-admins")
      end
    end

    describe '#update_group_names' do
      it 'should update primary group if name changes' do
        expect(organization.primary_group.name).not_to eq('Org 2.0')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.primary_group.reload.name).to eq('Org 2.0')
      end

      it 'should update guest group if name changes' do
        expect(organization.guest_group.name).not_to eq('Org 2.0 Guests')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.guest_group.reload.name).to eq('Org 2.0 Guests')
      end

      it 'should update admin group if name changes' do
        expect(organization.admin_group.name).not_to eq('Org 2.0 Admins')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.admin_group.reload.name).to eq('Org 2.0 Admins')
      end
    end

    describe '#parse_domain_whitelist' do
      before do
        organization.update(domain_whitelist: 'ideo.com, ideo.org')
      end

      it 'should parse string of domains into an array list' do
        expect(organization.domain_whitelist).to match_array(['ideo.com', 'ideo.org'])
      end
    end

    describe '#check_guests_for_domain_match' do
      let(:user) { create(:user, email: 'email@domain.org') }
      let(:guest) { create(:user, email: 'email@gmail.com') }
      let(:organization) { create(:organization) }

      before do
        user.add_role(Role::MEMBER, organization.guest_group)
        guest.add_role(Role::MEMBER, organization.guest_group)
      end

      it 'should set up user matching domain as a org primary group member' do
        expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be false
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be true
        # update whitelist to include user's email
        organization.update(domain_whitelist: 'domain.org')
        user.reload
        expect(user.reload.has_role?(Role::MEMBER, organization.primary_group)).to be true
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be false
      end

      it 'should not affect other guest memberships' do
        expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
        # update whitelist to include user's email
        organization.update(domain_whitelist: 'domain.org')
        guest.reload
        expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
      end
    end

    describe '#friendly_id' do
      let(:organization) { create(:organization) }

      it 'generates slug after primary group is saved' do
        expect(
          organization.reload.slug,
        ).to eq(
          organization.primary_group.handle.parameterize,
        )
      end
    end
  end

  describe '.create_for_user' do
    let!(:user) { create(:user) }
    let(:organization) { Organization.create_for_user(user) }

    it 'creates org' do
      expect { organization }.to change(Organization, :count).by(1)
    end

    it 'has name: FirstName LastName Organization' do
      org_name = "#{user.first_name} #{user.last_name} Organization"
      expect(organization.name).to eq(org_name)
      expect(organization.slug).to eq(org_name.parameterize)
    end

    it 'adds user as admin of org\'s primary group' do
      expect(organization.admins[:users]).to match_array([user])
    end

    it 'sets user.current_organization' do
      organization
      expect(user.reload.current_organization).to eq(organization)
    end

    context 'with user.last_name blank' do
      before do
        user.update_attributes(last_name: nil)
      end

      it 'has name: FirstName Organization' do
        expect(organization.name).to eq("#{user.first_name} Organization")
      end
    end
  end

  describe '#setup_user_membership' do
    let(:user) { create(:user, email: 'jill@ideo.com') }
    let(:guest) { create(:user, email: 'jack@gmail.com') }
    let(:organization) { create(:organization, domain_whitelist: ['ideo.com']) }

    before do
      organization.setup_user_membership(user)
      organization.setup_user_membership(guest)
    end

    it 'adds as an org member if they match the domain' do
      expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
      expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be false
    end

    it 'adds as an org guest if they don\'t match the domain' do
      expect(guest.has_role?(Role::MEMBER, organization.primary_group)).to be false
      expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
    end
  end

  describe '#setup_user_membership_and_collections' do
    let(:user) { create(:user, email: 'jill@ideo.com') }
    let(:organization) { create(:organization, domain_whitelist: ['ideo.com']) }

    it 'should create a UserCollection and SharedWithMeCollection for the user' do
      organization.setup_user_membership_and_collections(user)
      expect(user.collections.size).to eq(2)
    end

    it 'adds as an org member if they match the domain' do
      organization.setup_user_membership_and_collections(user)
      expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
    end

    it 'should set the user to be on the current organization' do
      organization.setup_user_membership_and_collections(user)
      expect(user.current_organization).to eq(organization)
      expect(user.current_user_collection_id).not_to be nil
    end

    context 'with getting_started collection' do
      let!(:getting_started_template) do
        create(:global_collection,
               name: 'Getting Started with Shape',
               organization: organization,
               num_cards: 3)
      end
      before do
        organization.update_attributes(
          getting_started_collection: getting_started_template,
        )
      end
      let(:user_getting_started_collection) do
        user.current_user_collection.collections.where(
          name: 'Getting Started with Shape'
        ).first
      end

      it 'copies collection to user' do
        organization.setup_user_membership_and_collections(user)
        expect(user_getting_started_collection.persisted?).to be true
        expect(user_getting_started_collection).not_to eq(getting_started_template)
        expect(user_getting_started_collection.editors).to eq(
          users: [user],
          groups: [],
        )
        expect(user_getting_started_collection.viewers).to eq(
          users: [],
          groups: [],
        )
      end
    end
  end

  describe '#remove_user_membership' do
    let(:organization) { create(:organization) }
    let(:other_org) { create(:organization) }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::MEMBER, other_org.primary_group)
      other_org.setup_user_membership(user)
      # NOTE: because this call is mocked, we are not *actually* removing them from the org
      allow(Roles::RemoveUserRolesFromOrganization).to receive(:call).and_return(true)
    end

    it 'should call the remove from organization service' do
      expect(Roles::RemoveUserRolesFromOrganization).to receive(:call).with(
        organization,
        user,
      )
      organization.remove_user_membership(user)
    end

    it 'should switch to their first organization' do
      organization.remove_user_membership(user)
      expect(user.current_organization).to eq other_org
    end

    context 'with user profile' do
      let!(:profile) { create(:user_profile, organization: organization, user: user) }

      before do
        # profile_template needs to be present for Collection::UserProfile methods to be called
        organization.update(
          profile_template: create(:collection, master_template: true),
        )
      end

      it 'should archive their profile' do
        organization.remove_user_membership(user)
        expect(profile.reload.archived).to be true
      end

      it 'should unarchive their profile if they rejoin' do
        organization.remove_user_membership(user)
        organization.setup_user_membership(user)
        expect(profile.reload.archived).to be false
      end
    end

    context 'for a user where this was their only organization' do
      let(:user) { create(:user) }

      before do
        user.roles.destroy_all
        user.reload
      end

      it 'should create a new organization' do
        expect(Organization).to receive(:create_for_user)
        organization.remove_user_membership(user)
      end
    end
  end

  describe '#users.active' do
    let(:member) { create(:user) }
    let(:guest) { create(:user) }
    let(:organization) { create(:organization, member: member, guest: guest) }

    it 'should count the number of users' do
      expect(organization.users.active.count).to eq 2
    end
  end
end
