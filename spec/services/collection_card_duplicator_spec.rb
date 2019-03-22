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

    context 'with data items that have legends' do
      let!(:data_item) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: from_collection)
      end
      let(:legend_item) { data_item.legend_item }

      before do
        legend_item.reload # to make sure data_item_ids aren't cached
        moving_cards.push(data_item.parent_collection_card)
        user.add_role(Role::EDITOR, data_item)
      end

      it 'duplicates legend if not selected' do
        expect(
          to_collection.collection_cards.map(&:item).compact,
        ).not_to include(legend_item)
        expect {
          service.call
        }.not_to change(Item::LegendItem, :count)
        expect(
          to_collection.collection_cards.reload.map(&:item).compact,
        ).to include(legend_item)
      end

      context 'with legend linked to other data items not duplicated' do
        let!(:data_item_two) do
          create(
            :data_item,
            :report_type_record,
            parent_collection: from_collection,
            legend_item: legend_item,
          )
        end

        before do
          user.add_role(Role::EDITOR, data_item_two)
        end

        it 'duplicates legend' do
          expect {
            service.call
          }.to change(Item::LegendItem, :count).by(1)
        end

        it 'leaves existing data item linked to legend item' do
          service.call
          to_collection_legend_items = to_collection.collection_cards.select do |card|
            card.item&.is_a?(Item::LegendItem)
          end.map(&:item)
          expect(
            to_collection_legend_items.size,
          ).to eq(1)
          expect(to_collection_legend_items.first).to eq(data_item.reload.legend_item)
          expect(data_item_two.reload.legend_item).not_to eq(data_item.legend_item)
        end
      end
    end
  end
end
