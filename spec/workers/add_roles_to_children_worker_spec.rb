require 'rails_helper'

RSpec.describe AddRolesToChildrenWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let(:users_to_add) { create_list(:user, 3) }
    let(:role_name) { Role::EDITOR }
    let(:instance_double) do
      double('Roles::AddToChildren')
    end

    before do
      allow(Roles::AddToChildren).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
    end

    it 'should call Roles::AddToChildren' do
      expect(Roles::AddToChildren).to receive(:new).with(
        users_to_add: users_to_add,
        parent: collection,
        role_name: role_name,
      )
      expect(instance_double).to receive(:call)
      expect(AddRolesToChildrenWorker.new.perform(
        users_to_add.map(&:id),
        groups_to_add.map(&:id),
        role_name,
        collection.id,
        collection.class.name,
      )).to be true
    end
  end
end
