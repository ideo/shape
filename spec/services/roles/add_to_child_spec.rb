require 'rails_helper'

RSpec.describe Roles::AddToChild, type: :service do
  let!(:collection) { create(:collection) }
  let(:user) { create(:user) }
  let!(:role) { user.add_role(:editor, collection) }
  let(:add_to_child) do
    Roles::AddToChild.new(object: collection, parent_role: role)
  end

  describe '#call' do
    it 'should create new role' do
      expect { add_to_child.call }.to change(Role, :count).by(1)
    end

    it 'should have same role as parent' do
      expect(add_to_child.call).to be true
      expect(add_to_child.role.name).to eq(role.name)
    end

    context 'with multiple users' do
      let!(:users) { create_list(:user, 3) }

      before do
        users.each { |u| u.add_role(:editor, collection) }
      end

      it 'should include all users from parent' do
        expect(add_to_child.call).to be true
        expect(add_to_child.role.users).to match_array([user] + users)
      end
    end
  end
end
