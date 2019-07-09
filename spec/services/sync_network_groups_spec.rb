require 'rails_helper'

RSpec.describe SyncNetworkGroups, type: :service do
  let(:group) { create(:group, network_id: 10) }
  let(:role) { create(:role, resource_type: 'Group', resource_id: group.network_id, name: Role::MEMBER) }

  describe '#call', :vcr do
    let(:user) { create(:user) }
    let(:users_role) { create(:users_role, role: role) }

    before do
      wrapped_return = double({includes: [users_role]})
      allow(NetworkApi::UsersRole).to receive(:where).and_return(wrapped_return)
      SyncNetworkGroups.call(user)
    end

    context'when the user has not been added to the group' do
      it 'should add the user to the group' do
        expect(user.has_role?(role.name, group)).to be true
      end
    end

    context 'when the user has been added to a group not created yet' do
      let(:users_role) { create(:users_role) }

      it 'should not add the user to the group' do
        expect(user.has_role?(role.name, group)).to be false
      end
    end
  end
end
