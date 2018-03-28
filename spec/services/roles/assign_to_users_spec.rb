require 'rails_helper'

RSpec.describe Roles::AssignToUsers, type: :service do
  let(:organization) { create(:organization) }
  let(:object) { create(:collection, num_cards: 2) }
  let(:users) { create_list(:user, 3) }
  let(:role_name) { :editor }
  let(:propagate_to_children) { false }
  let(:assign_role) do
    Roles::AssignToUsers.new(
      object: object,
      role_name: role_name,
      users: users,
      propagate_to_children: propagate_to_children,
    )
  end

  before :all do
    Sidekiq::Testing.inline!
  end

  after :all do
    Sidekiq::Testing.fake!
  end

  before do
    Sidekiq::Worker.clear_all
  end

  describe '#call' do
    it 'assigns role to users' do
      expect(assign_role.call).to be true
      expect(users.all? { |user| user.reload.has_role?(:editor, object) }).to be true
    end

    it 'does not call AddRolesToChildrenWorker' do
      expect(AddRolesToChildrenWorker).not_to receive(:perform_async)
      assign_role.call
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
        expect(assign_role.errors).to include('admin is not a valid role on Collection')
      end
    end

    context 'with propagate_to_children true' do
      let!(:propagate_to_children) { true }

      describe 'with collection' do
        it 'calls AddRolesToChildrenWorker' do
          expect(AddRolesToChildrenWorker).to receive(:perform_async).with(
            users.map(&:id),
            role_name,
            object.id,
            object.class.name.to_s,
          )
          assign_role.call
        end
      end

      describe 'with item' do
        let(:object) { create(:text_item) }

        it 'does not call AddRolesToChildrenWorker' do
          expect(AddRolesToChildrenWorker).not_to receive(:perform_async)
          assign_role.call
        end
      end
    end
  end
end
