require 'rails_helper'

RSpec.describe CollectionCardsAddRemoveTagWorker, type: :worker do
  let(:collection) { create(:collection) }
  let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
  let(:records) { collection_cards.map(&:record) }
  let(:user) { create(:user) }
  subject do
    CollectionCardsAddRemoveTagWorker.new
  end

  describe '#perform' do
    before do
      allow(CollectionUpdateBroadcaster).to receive(:call).and_call_original
    end
    let(:action) { nil }
    let(:perform) do
      subject.perform(
        collection_cards.map(&:id),
        'cats',
        nil,
        action,
        user.id,
      )
    end

    context 'with the add action' do
      let!(:action) { 'add' }

      it 'adds tags to all card records' do
        perform
        records.each do |record|
          expect(record.reload.tag_list).to eq(['cats'])
        end
      end

      it 'calls collection update broadcaster' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(collection, user)
        perform
      end
    end

    context 'with the remove action' do
      let!(:action) { 'remove' }

      before do
        records.each do |record|
          record.update(tag_list: 'cats, birds')
        end
      end

      it 'removes tags on all card records' do
        perform
        records.each do |record|
          expect(record.reload.tag_list).to eq(['birds'])
        end
      end

      it 'calls collection update broadcaster' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(collection, user)
        perform
      end
    end
  end
end
