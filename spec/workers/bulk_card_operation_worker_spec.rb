require 'rails_helper'

RSpec.describe BulkCardOperationWorker, type: :worker do
  let(:user) { create(:user) }
  let(:from_collection) { create(:collection, num_cards: 3) }
  let(:to_collection) { create(:collection, num_cards: 1) }
  let(:cards) { CollectionCard.where(id: from_collection.collection_cards.pluck(:id)) }
  let(:placement) { Mashie.new(row: 3, col: 2) }
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
          placement: placement,
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
          placement: placement,
          from_collection: from_collection,
          card_action: 'move',
        )
        subject
      end

      context 'moving to a foamcore board' do
        let(:to_collection) { create(:board_collection, num_cards: 1) }

        context 'without row/col placement' do
          let(:placement) { nil }

          it 'should return false for BulkCardOperationProcessor' do
            expect(placeholder).to eq false
          end
        end

        context 'with row/col placement' do
          let(:placement) { Mashie.new(row: 2, col: 3) }

          it 'should call CardMover with move action' do
            expect(CardMover).to receive(:call).with(
              to_collection: to_collection,
              cards: cards,
              placement: placement,
              from_collection: from_collection,
              card_action: 'move',
            )
            subject
          end
        end
      end
    end

    context 'with link action' do
      let(:action) { 'link' }

      it 'should call CardMover with link action' do
        expect(CardMover).to receive(:call).with(
          to_collection: to_collection,
          cards: cards,
          placement: placement,
          from_collection: from_collection,
          card_action: 'link',
        )
        subject
      end
    end

    context 'with failed action' do
      let(:action) { 'move' }

      it 'should rollback the placeholder destroy' do
        expect(CardMover).to receive(:call).with(
          to_collection: to_collection,
          cards: cards,
          placement: placement,
          from_collection: from_collection,
          card_action: 'move',
        ).and_return(false)
        subject
        expect(CollectionCard.find_by_id(placeholder.id)).not_to be nil
      end
    end
  end
end
