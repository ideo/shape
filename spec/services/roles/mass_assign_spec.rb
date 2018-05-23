require 'rails_helper'

RSpec.describe Roles::MassAssign, type: :service do
  let!(:current_user) { @user }
  let(:organization) { create(:organization) }
  let(:object) { create(:collection, num_cards: 2) }
  let(:users) { create_list(:user, 3) }
  let(:groups) { create_list(:group, 3) }
  let(:role_name) { :editor }
  let(:propagate_to_children) { false }
  let(:invited_by) { nil }
  let(:new_role) { false }
  let(:assign_role) do
    Roles::MassAssign.new(
      object: object,
      role_name: role_name,
      current_user: current_user,
      users: users,
      groups: groups,
      propagate_to_children: propagate_to_children,
      invited_by: invited_by,
      new_role: new_role,
    )
  end
  let(:deliver_double) do
    double('InvitationMailer')
  end

  before :all do
    Sidekiq::Testing.inline!
  end

  after :all do
    Sidekiq::Testing.fake!
  end

  before do
    Sidekiq::Worker.clear_all
    allow(InvitationMailer).to receive(:invite).and_return(deliver_double)
    allow(deliver_double).to receive(:deliver_later).and_return(true)
  end

  describe '#call' do
    it 'assigns role to users' do
      expect(assign_role.call).to be true
      expect(users.all? { |user| user.has_role?(:editor, object) }).to be true
    end

    it 'assigns role to groups' do
      expect(assign_role.call).to be true
      expect(groups.all? { |group| group.has_role?(:editor, object) }).to be true
    end

    it 'does not call AddRolesToChildrenWorker' do
      expect(AddRolesToChildrenWorker).not_to receive(:perform_async)
      assign_role.call
    end

    context 'given pending users' do
      let!(:users) { create_list(:user, 3, :pending) }

      it 'assigns role to users' do
        expect(assign_role.call).to be true
        expect(users.all? { |user| user.has_role?(:editor, object) }).to be true
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
            groups.map(&:id),
            @user,
            role_name,
            object.id,
            object.class.name,
          )
          assign_role.call
        end
      end
    end

    context 'when it should create activities and notifications' do
      let(:new_role) { true }
      let(:role_name) { Role::EDITOR.to_s }
      let(:instance_double) do
        double('ActivityAndNotificationBuilder')
      end

      before do
        allow(ActivityAndNotificationBuilder).to receive(:new).and_return(instance_double)
        allow(instance_double).to receive(:call).and_return(true)
      end

      it 'should call the activity and notification builder' do
        expect(ActivityAndNotificationBuilder).to receive(:new).with(
          actor: current_user,
          target: object,
          action: Activity.actions[:added_editor],
          subject_users: users,
          subject_groups: groups,
        )
        assign_role.call
      end
    end

    context 'when it should create links' do
      let(:new_role) { true }

      it 'adds links to user collections' do
        all_group_users = groups.reduce([]) {
          |accg, group| accg + group.roles.reduce([]) {
            |accr, role| accr + role.users } }
        expect(LinkToSharedCollectionsWorker).to receive(:perform_async).with(
          (users + all_group_users).map(&:id),
          groups.map(&:id),
          [object.id],
          [],
        )
        assign_role.call
      end

      context 'with a user and a group which contains the same user' do
        let!(:users) { create_list(:user, 1) }
        let!(:groups) { [create(:group, add_members: [users.first])] }

        it 'should only pass unique ids to create links' do
          expect(LinkToSharedCollectionsWorker).to receive(:perform_async).with(
            (users).map(&:id),
            groups.map(&:id),
            [object.id],
            [],
          )
          assign_role.call
        end
      end

      context 'with a primary group' do
        let!(:primary_group) { create(:group) }
        let!(:groups) { [primary_group] }

        before do
          allow(primary_group).to receive(:primary?).and_return(true)
        end

        it 'should not link to any primary groups' do
          expect(LinkToSharedCollectionsWorker).to receive(:perform_async).with(
            (users).map(&:id),
            [],
            [object.id],
            [],
          )
          assign_role.call
        end
      end

      context 'when the object is a group' do
        let!(:role_name) { :admin }
        let!(:user) { create(:user, add_to_org: organization) }
        let!(:users) { [user] }
        let!(:groups) { [] }
        let!(:linked_collection) { create(:collection) }
        let!(:object) { create(:group) }
        let!(:link) { create(:collection_card_link,
                             parent: object.current_shared_collection,
                             collection: linked_collection)}

        it 'should link all the groups shared collection cards' do
          expect(LinkToSharedCollectionsWorker).to receive(:perform_async).with(
            (users).map(&:id),
            [],
            [linked_collection.id],
            [],
          )
          assign_role.call
        end
      end
    end

    context 'with invited_by user' do
      let!(:invited_by) { create(:user) }

      context 'with new role' do
        let(:new_role) { true }
        it 'should queue up invitation for invited user' do
          expect(InvitationMailer).to receive(:invite).with(
            user_id: users.first.id,
            invited_by_id: invited_by.id,
            invited_to_type: object.class.name,
            invited_to_id: object.id,
          )
          assign_role.call
        end
      end

      context 'with switching role' do
        let(:new_role) { false }
        it 'should not send an email' do
          expect(InvitationMailer).not_to receive(:invite)
          assign_role.call
        end
      end
    end
  end
end
