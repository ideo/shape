require 'rails_helper'

RSpec.describe OrganizationAutojoiner, type: :service do
  let(:user) { create(:user, email: 'joe@org.net') }
  let(:organization) { create(:organization, autojoin_domains: ['org.net', 'org.com']) }

  describe '#available_orgs' do
    let(:org2) { create(:organization, autojoin_domains: ['org.net']) }
    let(:org3) { create(:organization, autojoin_domains: ['borg.net']) }

    it 'should find all orgs that match the domain' do
      orgs = OrganizationAutojoiner.new(user).available_orgs
      expect(orgs).to match_array [organization, org2]
    end

    context 'with no matching orgs' do
      let(:user) { create(:user, email: 'jane@gmail.com') }

      it 'should return empty' do
        orgs = OrganizationAutojoiner.new(user).available_orgs
        expect(orgs).to be_empty
      end
    end
  end

  describe '#autojoin' do
    it 'should automatically set the user as a member of the org' do
      expect(organization.can_view?(user)).to be false
      joined = OrganizationAutojoiner.new(user).autojoin
      expect(organization.can_view?(user)).to be true
      expect(joined).to include(organization)
    end

    context 'when already a member' do
      before do
        organization.setup_user_membership(user)
      end

      it 'should not re-add them to the org' do
        joined = OrganizationAutojoiner.new(user).autojoin
        expect(joined).to be_empty
      end
    end
  end
end
