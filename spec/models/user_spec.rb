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
        user.add_role(:member, org_group)
        user.reload
      end

      it 'should set current_organization' do
        expect(user.current_organization).to eq(org)
      end

      it 'should not override current_organization if already set' do
        user.add_role(:member, org_2_group)
        expect(user.reload.current_organization).to eq(org)
      end
    end

    describe '#after_remove_role' do
      before do
        user.add_role(:member, org_group)
      end

      it 'should set another org they belonged to as current' do
        user.add_role(:member, org_2_group)
        expect(user.reload.current_organization).to eq(org)

        user.remove_role(:member, org_group)
        expect(user.reload.current_organization).to eq(org_2)
      end

      it 'should remove current_organization if user only belonged to one' do
        user.remove_role(:member, org_group)
        expect(user.reload.current_organization).to  be_nil
      end
    end
  end

  describe '#organizations' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(:member, organizations[0].primary_group)
      user.add_role(:admin, organizations[1].primary_group)
    end

    it 'should return all organizations they have any role on' do
      expect(user.organizations).to match_array(organizations)
    end
  end
end
