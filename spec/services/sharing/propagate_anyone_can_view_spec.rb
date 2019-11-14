require 'rails_helper'

RSpec.describe Sharing::PropagateAnyoneCanView, type: :service do
  let!(:collection) { create(:collection, num_cards: 1, record_type: :collection) }
  let(:non_private_collection) { collection.collections.first }
  let!(:private_collection) { create(:private_collection, parent_collection: collection) }
  let(:propagate) do
    Sharing::PropagateAnyoneCanView.call(collection: collection)
  end

  describe '#call' do
    context 'setting to true' do
      it 'should propagate anyone_can_view = true to all non-private children' do
        collection.update(anyone_can_view: true)
        propagate
        expect(non_private_collection.reload.anyone_can_view).to be true
        expect(private_collection.reload.anyone_can_view).to be false
      end
    end
    context 'setting to false' do
      it 'should propagate anyone_can_view = false to all non-private children' do
        collection.update(anyone_can_view: false)
        # just for the sake of checking that it does not get changed
        private_collection.update(anyone_can_view: true)
        propagate
        expect(non_private_collection.reload.anyone_can_view).to be false
        expect(private_collection.reload.anyone_can_view).to be true
      end
    end
  end
end
