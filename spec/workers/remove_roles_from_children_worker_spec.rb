require 'rails_helper'

RSpec.describe RemoveRolesFromChildrenWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let(:user) { create(:user) }
    let(:group) { create(:group) }
    let(:instance_double) do
      double('Roles::RemoveFromChildren')
    end

    before do
      allow(Roles::RemoveFromChildren).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
    end

    it 'should call Roles::RemoveFromChildren' do
      expect(Roles::RemoveFromChildren).to receive(:new).with(
        parent: collection,
        role_name: Role::EDITOR,
        users: [user],
        groups: [group],
      )
      expect(instance_double).to receive(:call)
      expect(RemoveRolesFromChildrenWorker.new.perform(
        collection.id,
        collection.class.name,
        Role::EDITOR,
        [user.id],
        [group.id],
      )).to be true
    end
  end
end
