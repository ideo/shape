require 'rails_helper'

RSpec.describe MassRemoveRolesWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let(:user) { create(:user) }
    let(:group) { create(:group) }
    let(:instance_double) do
      double('Roles::MassRemove')
    end

    before do
      allow(Roles::MassRemove).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
    end

    it 'should call Roles::MassRemove' do
      expect(Roles::MassRemove).to receive(:new).with(
        object: collection,
        role_name: Role::EDITOR,
        users: [user],
        groups: [group],
        remove_from_children_sync: true,
      )

      expect(instance_double).to receive(:call)

      MassRemoveRolesWorker.new.perform(
        collection.id,
        collection.class.name,
        Role::EDITOR,
        [user.id],
        [group.id],
      )
    end
  end
end
