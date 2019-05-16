require 'rails_helper'

RSpec.describe Admin::AddRoleToUsers, type: :service do
  let(:users) { create_list(:user, 3) }
  let(:service) do
    Admin::AddRoleToUsers.new(
      users: users,
    )
  end

  describe '#call' do
    it 'assigns role to users' do
      service.call
      expect(users.all? { |user| user.has_role?(Role::SHAPE_ADMIN) }).to be true
    end

    it 'returns true if assigns role to all users' do
      expect(service.call).to be(true)
    end
  end
end
