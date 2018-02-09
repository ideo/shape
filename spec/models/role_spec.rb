require 'rails_helper'

RSpec.describe Role, type: :model do
  describe '#user_resources' do
    let(:user) { create(:user) }
    let!(:organizations) { create_list(:organization, 3) }

    before do
      user.add_role(:admin, organizations[0])
      user.add_role(:member, organizations[1])
      user.add_role(:guest, organizations[2])
    end

    it 'should return all orgs a user is a member, guest or admin of' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Organization'
        )
      ).to match_array(organizations)
    end

    it 'should scope on one role type if given' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Organization',
          role_name: :admin
        )
      ).to match_array([organizations[0]])
    end

    it 'should scope on many role types if given' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Organization',
          role_name: [:admin, :member]
        )
      ).to match_array([organizations[0], organizations[1]])
    end
  end
end
