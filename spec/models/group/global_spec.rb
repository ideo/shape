require 'rails_helper'

describe Group::Global, type: :model do
  context 'with common_resource group' do
    let(:group) { create(:global_group, :common_resource) }

    describe '#common_resource?' do
      it 'returns true' do
        expect(group.common_resource?).to be true
      end
    end

    describe '#after_role_update' do
      let!(:collection) { create(:collection) }

      describe 'add_role' do
        it 'marks the related collection as common_viewable' do
          expect(collection.common_viewable).to be nil
          group.add_role(Role::VIEWER, collection)
          expect(collection.reload.common_viewable).to be true
        end
      end

      describe 'remove_role' do
        it 'unmarks the related collection as common_viewable' do
          group.add_role(Role::VIEWER, collection)
          expect(collection.reload.common_viewable).to be true
          group.remove_role(Role::VIEWER, collection)
          expect(collection.reload.common_viewable).to be false
        end
      end
    end
  end
end
