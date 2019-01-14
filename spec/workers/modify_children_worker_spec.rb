require 'rails_helper'

RSpec.describe ModifyChildrenRolesWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let!(:collection) { create(:collection, num_cards: 2) }
    let!(:subject_users) { create_list(:user, 2) }
    let!(:subject_groups) { create_list(:group, 1) }
    let(:previous_anchor_id) { nil }
    let(:method) { 'add' }
    let(:role_name) { Role::EDITOR }
    let(:instance_double) do
      double('Roles::ModifyChildren')
    end

    before do
      allow(Roles::ModifyChildren).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
    end

    it 'should call Roles::ModifyChildren' do
      expect(Roles::ModifyChildren).to receive(:new).with(
        user: user,
        role_name: role_name,
        parent: collection,
        subject_users: subject_users,
        subject_groups: subject_groups,
        previous_anchor_id: previous_anchor_id,
        method: method,
      )
      expect(instance_double).to receive(:call)
      ModifyChildrenRolesWorker.new.perform(
        user.id,
        subject_users.map(&:id),
        subject_groups.map(&:id),
        role_name,
        collection.id,
        collection.class.name,
        previous_anchor_id,
        method,
      )
    end

    context 'with no child cards' do
      let(:collection) { create(:collection) }

      it 'should not call Roles::ModifyChildren' do
        expect(Roles::ModifyChildren).not_to receive(:new)
        expect(instance_double).not_to receive(:call)
        ModifyChildrenRolesWorker.new.perform(
          user.id,
          subject_users.map(&:id),
          subject_groups.map(&:id),
          role_name,
          collection.id,
          collection.class.name,
          previous_anchor_id,
          method,
        )
      end
    end
  end
end
