require 'rails_helper'

RSpec.describe CardSelector, type: :service do
  let(:num_cards) { 4 }
  let(:collection) { create(:board_collection, num_cards: num_cards, add_viewers: [user]) }
  let(:cards) { collection.collection_cards }
  let(:user) { create(:user) }
  let(:selected_card) { cards.first }
  let(:selector) do
    CardSelector.new(
      card: selected_card,
      direction: 'bottom',
      user: user,
    )
  end

  context 'normal collection' do
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

    context 'with user permissions' do
      before do
        hidden = cards[1].record
        hidden.unanchor_and_inherit_roles_from_anchor!
        user.remove_role(Role::VIEWER, hidden)
      end

      it 'rejects cards the user cannot view' do
        selected_cards = selector.call
        expected_selected = cards.reject { |c| [cards[1], cards[2]].include?(c) }
        expect(selected_cards.pluck(:id)).to eq expected_selected.pluck(:id)
      end
    end
  end

  context 'with a blank row' do
    let(:num_cards) { 5 }

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

  context 'with wide cards that poke out' do
    let(:num_cards) { 6 }

    before do
      cards[0].update(width: 2, height: 1, row: 1, col: 2)
      cards[1].update(width: 2, height: 1, row: 2, col: 1)
      cards[2].update(width: 3, height: 1, row: 2, col: 3)
      cards[3].update(width: 1, height: 2, row: 3, col: 1)
      cards[4].update(width: 1, height: 1, row: 3, col: 5)
      cards[5].update(width: 1, height: 1, row: 4, col: 2)
    end

    it 'select the correct cards below the main one' do
      selected_cards = selector.call
      expected_selected = [cards[0], cards[1], cards[2], cards[3], cards[4]]
      expect(selected_cards.pluck(:id).sort).to eq expected_selected.pluck(:id).sort
    end
  end
end
