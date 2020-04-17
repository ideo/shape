require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

RSpec.describe TextItemBroadcastWorker, type: :worker do
  include_context 'CollectionUpdateBroadcaster setup'
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection) }
    let(:text_item) { create(:text_item, parent_collection: collection) }
    let(:subject) do
      TextItemBroadcastWorker.new
    end
    let(:run_worker) do
      subject.perform(
        text_item.id,
        user.id,
      )
    end

    context 'with no linked cards' do
      it 'should not call the LinkBroadcastWorker' do
        expect(LinkBroadcastWorker).not_to receive(:perform_sync)
        run_worker
      end
    end

    context 'with linked cards' do
      let!(:linked_cards) do
        create(:collection_card_link_text, item: text_item)
      end

      it 'should call the LinkBroadcastWorker' do
        expect(LinkBroadcastWorker).to receive(:perform_sync).with(
          text_item.id,
          'Item',
          user.id,
        )
        run_worker
      end
    end

    context 'with no viewers of the collection' do
      it 'should not call the broadcaster' do
        expect(broadcaster_instance).not_to receive(:card_updated)
        run_worker
      end
    end

    context 'with viewers of the collection' do
      before do
        collection.started_viewing(user)
      end

      it 'should call the broadcaster' do
        expect(CollectionUpdateBroadcaster).to receive(:new).with(
          collection,
          user,
        )
        expect(broadcaster_instance).to receive(:text_item_updated).with(text_item)
        run_worker
      end
    end
  end
end
