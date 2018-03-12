require 'rails_helper'

RSpec.describe RemoveRoleFromChildrenWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let(:user) { create(:user) }
    let!(:role) { user.add_role(:editor, collection) }
    let!(:role_double) do
      class_double('Roles::RemoveRoleFromChildren')
    end

    it 'should call Roles::RemoveRoleFromChildren' do
      expect(role_double).to receive(:new).with(
        object: collection,
        role: role,
      )
      RemoveRoleFromChildrenWorker.new.perform(role.id, collection_id, collection.class.name)
    end
  end
end
