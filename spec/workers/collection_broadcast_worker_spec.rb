require 'rails_helper'

RSpec.describe CollectionBroadcastWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, broadcasting: true) }
    let(:subject) do
      CollectionBroadcastWorker.new
    end
    let(:run_worker) { subject.perform(collection.id, user.id) }

    it 'should call the broadcaster' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(collection, user)
      run_worker
    end

    it 'should unmark "broadcasting"' do
      expect(collection.broadcasting?).to be true
      run_worker
      expect(collection.reload.broadcasting?).to be false
    end
  end
end
