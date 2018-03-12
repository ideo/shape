require 'rails_helper'

RSpec.describe AssignRole, type: :service do
  let(:organization) { create(:organization) }
  let(:object) { create(:text_item) }
  let(:users) { create_list(:user, 3) }
  let(:role_name) { :editor }
  let(:assign_role) do
    AssignRole.new(object: object, role_name: role_name, users: users)
  end

  describe '#call' do
    it 'assigns role to users' do
      expect(assign_role.call).to be true
      expect(users.all? { |user| user.reload.has_role?(:editor, object) }).to be true
    end

    context 'given pending users' do
      let!(:users) { create_list(:user, 3, :pending) }

      it 'assigns role to users' do
        expect(assign_role.call).to be true
        expect(users.all? { |user| user.reload.has_role?(:editor, object) }).to be true
      end
    end

    context 'with object that can\'t be assigned roles' do
      let!(:object) { create(:organization) }

      it 'returns errors' do
        expect(assign_role.call).to be false
        expect(assign_role.errors).to include("You can't assign roles to that object")
      end
    end

    context 'with invalid role for object' do
      let!(:role_name) { :admin }

      it 'returns errors' do
        expect(assign_role.call).to be false
        expect(assign_role.errors).to include('admin is not a valid role on Item::TextItem')
      end
    end
  end
end
