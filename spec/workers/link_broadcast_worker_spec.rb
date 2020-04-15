require 'rails_helper'

RSpec.describe LinkBroadcastWorker, type: :worker do
  describe '#perform' do
    let(:collection) { create(:collection, broadcasting: true) }
    let(:subject) do
      LinkBroadcastWorker.new
    end
    let(:run_worker) { subject.perform(collection.id) }

    xit 'should call the broadcaster' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(collection)
      run_worker
    end

    xit 'should unmark "broadcasting"' do
      expect(collection.broadcasting?).to be true
      run_worker
      expect(collection.reload.broadcasting?).to be false
    end
  end
end
