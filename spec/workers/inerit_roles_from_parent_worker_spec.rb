require 'rails_helper'

RSpec.describe InheritRolesFromParentWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection) }
    let!(:role_double) do
      class_double('Roles::InheritRolesFromParent')
    end

    it 'should call Roles::InheritRolesFromParent' do
      expect(role_double).to receive(:new).with(collection)
      InheritRolesFromParentWorker.new.perform(collection_id, collection.class.name)
    end
  end
end
