require 'rails_helper'

RSpec.describe BulkCardOperationWorker, type: :worker do
  let(:user) { create(:user) }
  let(:from_collection) { create(:collection, num_cards: 3) }
  let(:to_collection) { create(:collection, num_cards: 1) }
  let(:cards) { from_collection.collection_cards }
  let(:placement) { 'beginning' }
  let(:action) { 'duplicate' }

  let(:placeholder) do
    BulkCardOperationProcessor.call(
      cards: cards,
      action: action,
      placement: placement,
      to_collection: to_collection,
      for_user: user,
    )
  end

  subject do
    BulkCardOperationWorker.new.perform(
      cards.pluck(:id),
      action,
      placeholder.id,
      user.id,
    )
  end

  describe '#perform' do
    it 'should destroy the placeholder' do
      expect(CollectionCard.find_by_id(placeholder.id)).not_to be nil
      subject
      # should now be destroyed
      expect(CollectionCard.find_by_id(placeholder.id)).to be nil
    end

    it 'should broadcast the updates' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(to_collection)
      subject
    end

    context 'with duplicate action' do
      let(:action) { 'duplicate' }

      it 'should call CollectionCardDuplicator' do
        expect(CollectionCardDuplicator).to receive(:call).with(
          to_collection: to_collection,
          cards: cards,
          placement: placeholder.order,
          for_user: user,
        )
        subject
      end
    end

    context 'with move action' do
      let(:action) { 'move' }

      it 'should call CardMover with move action' do
        expect(CardMover).to receive(:call).with(
          to_collection: to_collection,
          cards: cards,
          placement: placeholder.order,
          from_collection: from_collection,
          card_action: 'move',
        )
        subject
      end
    end

    context 'with link action' do
      let(:action) { 'link' }

      it 'should call CardMover with link action' do
        expect(CardMover).to receive(:call).with(
          to_collection: to_collection,
          cards: cards,
          placement: placeholder.order,
          from_collection: from_collection,
          card_action: 'link',
        )
        subject
      end
    end
  end
end
