require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  context 'associations' do
    it { should have_many :collections }
    it { should have_many :groups }
    it { should belong_to :primary_group }
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
  end

  describe '.create_for_user' do
    let!(:user) { create(:user) }
    let(:organization) { Organization.create_for_user(user) }

    it 'creates org' do
      expect { organization }.to change(Organization, :count).by(1)
    end

    it 'has name: FirstName LastName Organization' do
      expect(organization.name).to eq("#{user.first_name} #{user.last_name} Organization")
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

    before do
      organization.setup_user_membership_and_collections(user)
    end

    it 'should create a UserCollection and SharedWithMeCollection for the user' do
      expect(user.collections.size).to eq(2)
    end

    it 'adds as an org member if they match the domain' do
      expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
    end

    it 'should set the user to be on the current organization' do
      expect(user.current_organization).to eq(organization)
      expect(user.current_user_collection_id).not_to be nil
    end
  end

  describe '#remove_user_membership' do
    let(:organization) { create(:organization) }
    let(:other_org) { create(:organization) }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::MEMBER, other_org.primary_group)
      other_org.setup_user_membership(user)
      allow(Roles::RemoveUserRolesFromOrganization).to receive(:call).and_return(true)
    end

    it 'should call the remove from organization service' do
      expect(Roles::RemoveUserRolesFromOrganization).to receive(:call).with(
        organization,
        user,
      )
      organization.remove_user_membership(user)
    end

    it 'should switch to their first organizaiton' do
      organization.remove_user_membership(user)
      expect(user.current_organization).to eq other_org
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

  describe '#user_count' do
    let(:member) { create(:user) }
    let(:guest) { create(:user) }
    let(:organization) { create(:organization, member: member, guest: guest) }

    it 'should count the number of users' do
      expect(organization.user_count).to eq 2
    end
  end

  describe '#setup_templates' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user) }

    before do
      organization.setup_templates(user)
    end

    it 'should create a template collection for the org' do
      expect(organization.template_collection.persisted?).to be true
      expect(organization.template_collection.name).to eq(
        "#{organization.name} Templates")
    end

    it 'should add the admin group as the editor role' do
      expect(organization.admin_group.has_role?(Role::EDITOR,
             organization.template_collection)).to be true
    end
  end
end
