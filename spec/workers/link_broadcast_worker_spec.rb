require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

RSpec.describe LinkBroadcastWorker, type: :worker do
  include_context 'CollectionUpdateBroadcaster setup'
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection) }
    let(:parent_of_links) { create(:collection) }
    let(:linked_cards) do
      create_list(:collection_card_link_collection, 2, parent: parent_of_links, collection: collection)
    end
    let(:subject) do
      LinkBroadcastWorker.new
    end
    let(:run_worker) do
      subject.perform(
        collection.id,
        'Collection',
        user.id,
      )
    end

    context 'with no viewers of the collection' do
      it 'should not call the broadcaster' do
        expect(broadcaster_instance).not_to receive(:card_updated)
        run_worker
      end
    end

    context 'with viewers of the collection' do
      before do
        parent_of_links.started_viewing(user)
      end

      it 'should call the broadcaster once for every link' do
        linked_cards.each do |card|
          expect(CollectionUpdateBroadcaster).to receive(:new).with(
            parent_of_links,
            user,
          )
          expect(broadcaster_instance).to receive(:card_updated).with(card)
        end
        run_worker
      end
    end
  end
end
