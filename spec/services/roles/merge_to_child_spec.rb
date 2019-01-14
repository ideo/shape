require 'rails_helper'

RSpec.describe Roles::MergeToChild, type: :service do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, add_editors: [user]) }
  let(:child) { create(:collection, parent_collection: collection, add_editors: [user]) }
  let(:merge_service) do
    Roles::MergeToChild.new(
      parent: collection,
      child: child,
    )
  end

  # NOTE: some similar tests exist in card_mover_spec where this logic was originally needed
  describe '#call' do
    context 'with same roles anchor' do
      before do
        child.update(roles_anchor_collection_id: collection.id)
      end

      it 'should not assign any permissions' do
        expect(Roles::MassAssign).not_to receive(:new)
        merge_service.call
      end
    end

    context 'with all roles from record included on parent' do
      let(:other_user) { create(:user) }

      before do
        other_user.add_role(Role::VIEWER, collection)
      end

      it 'should not assign any permissions and destroy card roles' do
        expect(Roles::MassAssign).not_to receive(:new)
        expect(child.roles).not_to be_empty
        expect(child.can_view?(other_user)).to be false
        merge_service.call
        child.reload
        expect(child.roles).to be_empty
        expect(child.can_view?(other_user)).to be true
      end
    end

    context 'with different roles' do
      let(:other_user) { create(:user) }
      let(:group) { create(:group) }

      before do
        # add a different role onto child so that it has more roles than the collection
        other_user.add_role(Role::VIEWER, child)
        # add a different role onto collection
        group.add_role(Role::EDITOR, collection)
      end

      it 'should assign permissions' do
        # will assign roles from the collection down to the child
        expect(child.can_edit?(group)).to be false
        merge_service.call
        group.reset_cached_roles!
        expect(child.can_edit?(group)).to be true
        expect(child.roles).not_to be_empty
      end
    end
  end
end
