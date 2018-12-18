require 'rails_helper'

RSpec.describe CollectionCardDuplicator, type: :service do
  describe '#call' do
    let(:user) { create(:user) }
    let!(:from_collection) { create(:collection, num_cards: 3, add_viewers: [user]) }
    let(:moving_cards) { from_collection.collection_cards.first(2) }
    let!(:to_collection) do
      create(:collection, num_cards: 3, add_editors: [user])
    end
    let(:placement) { 'beginning' }
    let(:service) do
      CollectionCardDuplicator.new(
        to_collection: to_collection,
        cards: moving_cards,
        placement: placement,
        for_user: user,
      )
    end

    # NOTE: This test is very similar to collection_cards_controller_spec#duplicate
    # As a result this test suite is kept pretty sparse to not repeat everything from there
    it 'duplicates cards from one collection to the other' do
      expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
      new_cards = service.call

      # newly created cards should be duplicates
      first_cards = to_collection.collection_cards.first(2)
      expect(first_cards).to match_array new_cards
      expect(first_cards.map(&:item)).not_to match_array moving_cards.map(&:item)
      # names should match, in same order
      expect(first_cards.map(&:item).map(&:name)).to eq moving_cards.map(&:item).map(&:name)
      expect(to_collection.collection_cards.first.primary?).to be true
      expect(to_collection.collection_cards.count).to eq 5
    end
  end
end
