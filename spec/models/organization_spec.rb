require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  context 'associations' do
    it { should have_many :collections }
    it { should have_many :groups }
    it { should belong_to :primary_group }
    it { should belong_to :filestack_file }
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

  describe '#add_new_user' do
    let(:user) { create(:user, email: 'jill@ideo.com') }
    let(:guest) { create(:user, email: 'jack@gmail.com') }
    let(:organization) { create(:organization, domain_whitelist: ['ideo.com']) }

    before do
      organization.add_new_user(user)
      organization.add_new_user(guest)
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
end
