require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  context 'associations' do
    it { should have_many :collections }
    it { should have_many :groups }
    it { should belong_to :primary_group }
    it { should have_one :filestack_file }
  end

  context 'callbacks' do
    let(:organization) { create(:organization) }

    describe '#initialize_primary_group' do
      it 'should create group with same name as org' do
        expect(organization.primary_group.persisted?).to be true
        expect(organization.primary_group.name).to eq(organization.name)
      end
    end

    describe '#update_primary_group_name' do
      it 'should update group if name changes' do
        expect(organization.primary_group.name).not_to eq('Org 2.0')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.primary_group.reload.name).to eq('Org 2.0')
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
      expect(organization.admins).to match_array([user])
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
end
