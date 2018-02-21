require 'rails_helper'

RSpec.describe Role, type: :model do
  describe '#user_resources' do
    let(:user) { create(:user) }
    let!(:groups) { create_list(:group, 2) }

    before do
      user.add_role(Role::ADMIN, groups[0])
      user.add_role(Role::MEMBER, groups[1])
    end

    it 'should return all groups a user is a member or admin of' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Group'
        )
      ).to match_array(groups)
    end

    it 'should scope on one role type if given' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Group',
          role_name: Role::ADMIN
        )
      ).to match_array([groups[0]])
    end

    it 'should scope on many role types if given' do
      expect(
        Role.user_resources(
          user: user,
          resource_type: 'Group',
          role_name: [Role::ADMIN, Role::MEMBER]
        )
      ).to match_array([groups[0], groups[1]])
    end
  end
end
