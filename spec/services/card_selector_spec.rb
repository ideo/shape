require 'rails_helper'

RSpec.describe CardSelector, type: :service do
  let(:collection) { create(:collection, num_cards: 4) }
  let(:cards) { collection.collection_cards }
  let(:selected_card) { cards.first }
  let(:selector) { CardSelector.new(card: selected_card, direction: 'bottom') }

  context 'normal collection' do
    let(:collection) { create(:collection, num_cards: 4) }

    before do
      cards[0].update(width: 1, height: 1, row: 1, col: 1)
      cards[1].update(width: 1, height: 1, row: 2, col: 1)
      cards[2].update(width: 1, height: 1, row: 2, col: 2)
      cards[3].update(width: 2, height: 1, row: 3, col: 1)
    end

    it 'select the correct cards below the main one' do
      selected_cards = selector.call
      expected_selected = cards.reject { |c| c.id == cards[2].id }
      expect(selected_cards.pluck(:id)).to eq expected_selected.pluck(:id)
    end
  end

  context 'with a blank row' do
    let(:collection) { create(:collection, num_cards: 5) }

    before do
      cards[0].update(width: 2, height: 1, row: 1, col: 1)
      cards[1].update(width: 1, height: 1, row: 2, col: 1)
      cards[2].update(width: 1, height: 1, row: 2, col: 2)
      cards[3].update(width: 1, height: 1, row: 4, col: 2)
      cards[4].update(width: 1, height: 2, row: 3, col: 3)
    end

    it 'select the correct cards below the main one' do
      selected_cards = selector.call
      expected_selected = [cards[0], cards[1], cards[2]]
      expect(selected_cards.pluck(:id)).to eq expected_selected.pluck(:id)
    end
  end

  context 'with a card 2 high' do
    let(:collection) { create(:collection, num_cards: 4) }

    before do
      cards[0].update(width: 2, height: 1, row: 1, col: 1)
      cards[1].update(width: 1, height: 2, row: 2, col: 2)
      cards[2].update(width: 1, height: 1, row: 4, col: 2)
      cards[3].update(width: 1, height: 1, row: 4, col: 1)
    end

    it 'select the correct cards below the main one' do
      selected_cards = selector.call
      expected_selected = [cards[0], cards[1], cards[2]]
      expect(selected_cards.pluck(:id)).to eq expected_selected.pluck(:id)
    end
  end

  context 'with a wide card that pokes in' do
    let(:collection) { create(:collection, num_cards: 4) }

    before do
      cards[0].update(width: 1, height: 2, row: 1, col: 3)
      cards[1].update(width: 3, height: 1, row: 3, col: 1)
      cards[2].update(width: 1, height: 1, row: 4, col: 3)
      cards[3].update(width: 1, height: 1, row: 2, col: 2)
    end

    it 'select the correct cards below the main one' do
      selected_cards = selector.call
      expected_selected = [cards[0], cards[1], cards[2]]
      expect(selected_cards.pluck(:id)).to eq expected_selected.pluck(:id)
    end
  end
end
