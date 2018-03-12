require 'rails_helper'

RSpec.describe AddRolesToChildrenWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let(:user) { create(:user) }
    let!(:role) { user.add_role(Role::EDITOR, collection) }
    let(:instance_double) do
      double('Roles::AddToChildren')
    end

    before do
      allow(Roles::AddToChildren).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
    end

    it 'should call Roles::AddToChildren' do
      expect(Roles::AddToChildren).to receive(:new).with(
        object: collection,
        roles: [role],
      )
      expect(instance_double).to receive(:call)
      expect(AddRolesToChildrenWorker.new.perform(
        [role.id],
        collection.id,
        collection.class.name,
      )).to be true
    end
  end
end
