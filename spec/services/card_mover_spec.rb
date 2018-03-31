require 'rails_helper'

RSpec.describe CardMover, type: :service do
  let(:from_collection) { create(:collection, num_cards: 3) }
  let(:to_collection) { create(:collection, num_cards: 3) }
  let!(:moving_cards) { from_collection.collection_cards }
  let(:card_ids) { moving_cards.map(&:id) }
  let(:placement) { 'beginning' }
  let(:card_mover) do
    CardMover.new(
      from_collection: from_collection,
      to_collection: to_collection,
      card_ids: card_ids,
      placement: placement,
    )
  end

  describe '#call' do
    context 'with placement "beginning"' do
      let(:placement) { 'beginning' }

      it 'should move cards into the to_collection at the beginning' do
        expect(from_collection.collection_cards.include?(moving_cards))
        card_mover.call
        to_collection.reload
        expect(to_collection.collection_cards.include?(moving_cards))
        expect(to_collection.collection_cards.first(3)).to match_array moving_cards
      end
    end

    context 'with placement "end"' do
      let(:placement) { 'end' }

      it 'should move cards into the to_collection at the end' do
        expect(from_collection.collection_cards.include?(moving_cards))
        card_mover.call
        to_collection.reload
        expect(to_collection.collection_cards.include?(moving_cards))
        expect(to_collection.collection_cards.last(3)).to match_array moving_cards
      end
    end

    context 'with invalid move' do
      let(:parent_collection) { create(:collection) }
      let(:parent_collection_card) { create(:collection_card, collection: parent_collection) }
      let(:from_collection) { create(:collection, num_cards: 3, parent_collection_card: parent_collection_card) }
      let(:to_parent_collection_card) { create(:collection_card, parent: from_collection) }
      let(:to_collection) { create(:collection, num_cards: 3, parent_collection_card: to_parent_collection_card) }
      let(:card_ids) { [to_parent_collection_card.id] }

      it 'should produce errors if collection is moving inside itself' do
        expect(card_mover.call).to be false
        expect(card_mover.errors).to match_array ['You can\'t move a collection inside of itself.']
      end
    end
  end
end
