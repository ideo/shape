require 'rails_helper'

describe User, type: :model do
  let!(:user) { create(:user) }

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
  end

  context 'callbacks' do
    describe '#after_add_role' do
      let(:organization) { create(:organization) }

      it 'should set current_organization' do
        user.add_role(:member, organization)
        expect(user.reload.current_organization).to eq(organization)
      end

      it 'should not override current_organization if already set' do
        org2 = create(:organization)
        user.update_attributes(current_organization: org2)
        expect(user.reload.current_organization).to eq(org2)
        user.add_role(:member, organization)
        expect(user.reload.current_organization).to eq(org2)
      end
    end
  end

  describe '#organizations' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(:member, organizations[0])
      user.add_role(:admin, organizations[1])
    end

    it 'should return all organizations they have any role on' do
      expect(user.organizations).to match_array(organizations)
    end
  end

  describe '#organizations_with_role' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(:member, organizations[0])
      user.add_role(:admin, organizations[1])
    end

    it 'should only return orgs with role provided' do
      expect(user.organizations_with_role(:admin)).to match_array([organizations[1]])
    end
  end
end
