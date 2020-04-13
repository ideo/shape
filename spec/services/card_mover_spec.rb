require 'rails_helper'

RSpec.describe CardMover, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let!(:from_collection) { create(:collection, organization: organization, num_cards: 3) }
  let!(:to_collection) { create(:collection, organization: organization, num_cards: 3) }
  let!(:moving_cards) { from_collection.collection_cards }
  let(:cards) { moving_cards }
  let(:placement) { 'beginning' }
  let(:card_action) { 'move' }
  let(:card_mover) do
    CardMover.new(
      from_collection: from_collection,
      to_collection: to_collection,
      cards: cards,
      placement: placement,
      card_action: card_action,
    )
  end

  before do
    moving_cards.each do |card|
      user.add_role(Role::EDITOR, card.record)
    end
    user.add_role(Role::EDITOR, from_collection)
    user.add_role(Role::EDITOR, to_collection)
  end

  describe '#call' do
    context 'with placement "beginning"' do
      let(:placement) { 'beginning' }

      it 'should move cards into the to_collection at the beginning' do
        expect(from_collection.collection_cards).to match_array moving_cards
        card_mover.call
        expect(to_collection.reload.collection_cards.first(3)).to match_array moving_cards
      end

      context 'with roles' do
        let(:moving_cards) { [from_collection.collection_cards.first] }
        let(:card) { moving_cards.first }

        it 'should assign permissions' do
          # will assign roles from the to_collection down to the card.record
          expect(Roles::MergeToChild).to receive(:call).with(
            parent: to_collection,
            child: card.record,
          )
          card_mover.call
        end
      end

      context 'with link cards' do
        let(:from_collection) do
          create(:collection, organization: organization, num_cards: 3, record_type: :link_text, card_relation: :link)
        end

        it 'should not assign permissions' do
          expect(Roles::MergeToChild).not_to receive(:call)
          card_mover.call
        end
      end

      context 'with subcollections' do
        let!(:child_collection) do
          create(
            :collection,
            parent_collection: from_collection,
            num_cards: 2,
            record_type: :collection,
            roles_anchor_collection: nil,
            add_editors: [user],
          )
        end

        before do
          moving_cards.reload
        end

        it 'should recalculate breadcrumbs' do
          expect(to_collection).to receive(:recalculate_child_breadcrumbs_async).with(moving_cards)
          card_mover.call
        end

        it 'should calculate correct roles_anchor' do
          card_mover.call
          child_collection.reload
          expect(child_collection.roles_anchor_collection_id).to eq to_collection.id
          expect(child_collection.collections.first.roles_anchor_collection_id).to eq to_collection.id
        end
      end

      context 'with private record' do
        let(:moving_cards) { from_collection.collection_cards.limit(1) }
        let(:card) { moving_cards.first }
        let(:record) { card.record }
        before do
          record.unanchor_and_inherit_roles_from_anchor!
          user.remove_role(Role::EDITOR, record)
          card.record.update(cached_inheritance: { private: true })
        end

        it 'should not assign permissions' do
          expect(Roles::MergeToChild).not_to receive(:call)
          card_mover.call
        end
      end
    end

    context 'with placement "end"' do
      let(:placement) { 'end' }

      it 'should move cards into the to_collection at the end' do
        expect(from_collection.collection_cards).to match_array moving_cards
        card_mover.call
        expect(from_collection.reload.collection_cards).to match_array []
        expect(to_collection.reload.collection_cards.last(3)).to match_array moving_cards
      end

      context 'when to_collection is a foamcore board' do
        let!(:to_collection) do
          create(:board_collection,
                 num_cards: 3,
                 add_editors: [user],
                 organization: organization)
        end
        let(:placement) { 'end' }

        it 'places cards in their best fit after the last card' do
          card_mover.call
          to_collection.reload
          # they are all 1x1 so should fit consecutively
          expect(to_collection.collection_cards.last(3).pluck(:row, :col)).to eq([
            [3, 1],
            [3, 2],
            [3, 3],
          ])
        end
      end
    end

    context 'with placement as an order number (insert cards in middle of collection)' do
      let(:placement) { 1 }
      let(:cards) { moving_cards.ordered }
      let(:original_cards) { to_collection.collection_cards.to_a }
      before do
        # mix them around to make sure we're following `order` and not id/date
        original_cards[0].update_columns(order: 0)
        original_cards[2].update_columns(order: 1)
        original_cards[1].update_columns(order: 2)
        moving_cards[1].update_columns(order: 0)
        moving_cards[2].update_columns(order: 1)
        moving_cards[0].update_columns(order: 2)
      end

      it 'should place the moved cards in the middle of the collection, preserving their order' do
        card_mover.call
        expect(to_collection.reload.collection_cards.map(&:id)).to eq([
          # 3 cards so order '1' should be in the middle
          # before: [0, 2, 1]
          # after: [0, x, x, x, 2, 1]
          original_cards[0].id,
          moving_cards[1].id,
          moving_cards[2].id,
          moving_cards[0].id,
          original_cards[2].id,
          original_cards[1].id,
        ])
      end

      context 'with moving with same collection that\'s a master template' do
        let!(:from_collection) { to_collection }

        before do
          from_collection.update(master_template: true)
        end

        it 'should call update_template_instances' do
          expect(from_collection).to receive(:queue_update_template_instances).with(
            updated_card_ids: from_collection.collection_cards.pluck(:id),
            template_update_action: :update_card_attributes,
          )
          card_mover.call
        end
      end

      context 'with pinned cards that already exist in to_collection' do
        before do
          # update first 2 cards to be pinned
          to_collection.reload.collection_cards.limit(2).update_all(pinned: true)
        end

        it 'should place the moved cards in the middle of the collection' do
          card_mover.call
          expect(to_collection.reload.collection_cards.map(&:id)).to eq([
            original_cards[0].id,
            # even though we use placement: 1, the first two cards are pinned
            original_cards[2].id,
            moving_cards[1].id,
            moving_cards[2].id,
            moving_cards[0].id,
            original_cards[1].id,
          ])
        end

        it 'should pin the all the moving cards' do
          card_mover.call
          expect(to_collection.reload.collection_cards.pinned.all?(&:id)).to eq(true)
        end

        context 'moving cards right next to unpinned cards' do
          before do
            # update second card to be pinned
            to_collection.reload.collection_cards[1].update(pinned: false)
          end
          it 'should keep all the moving cards unpinned' do
            card_mover.call
            cards_moved = to_collection.reload.collection_cards.select { |cc| moving_cards.pluck(:id).include? cc.id }
            expect(cards_moved.pluck(:pinned)).to all(be_falsy)
          end
        end
      end

      context 'with pinned cards in the from_collection' do
        before do
          # update first 2 cards to be pinned
          from_collection.reload.collection_cards.limit(2).update_all(pinned: true)
        end

        context 'moving into a normal collection' do
          it 'should unpin all cards' do
            card_mover.call
            to_collection.reload
            expect(to_collection.collection_cards.count).to eq 6
            expect(to_collection.collection_cards.none?(&:pinned?)).to be true
          end
        end

        context 'moving into a master template' do
          let!(:child_collection) do
            create(:collection, parent_collection: from_collection, num_cards: 2, record_type: :collection)
          end
          let!(:child_subcollection_cards) do
            create_list(:collection_card_text, 2, parent: child_collection.collections.first)
          end
          before do
            to_collection.update(master_template: true)
          end

          context 'moving to the beginning of master template with pinned cards' do
            it 'should pin all cards if moving to the beginning of collection with pinned cards' do
              card_mover.call
              to_collection.reload
              expect(to_collection.collection_cards.count).to eq 7
              expect(to_collection.collection_cards.any?(&:pinned?)).to be true
              subcollection = to_collection.collections.first
              expect(subcollection.collection_cards.all?(&:pinned)).to be true
              # subcollection should now be a subtemplate
              expect(subcollection.master_template?).to be true
              expect(subcollection.collections.first.master_template?).to be true
            end
          end

          context 'when linking' do
            let(:card_action) { 'link' }

            it 'should not convert to template' do
              links = card_mover.call
              expect(links.last.collection).to eq(child_collection)
              expect(links.last.collection.master_template?).to be false
            end
          end
        end
      end
    end

    context 'with card_action "link"' do
      let(:card_action) { 'link' }
      let(:linking_cards) { moving_cards }

      it 'should link cards into the to_collection' do
        card_mover.call
        # original cards should still be in the from_collection
        expect(from_collection.reload.collection_cards).to match_array linking_cards
        # first card should now be a new link
        to_collection.reload

        expect(to_collection.collection_cards.first.link?).to be true
        expect(to_collection.collection_cards.first.item).to eq linking_cards.first.item
      end

      it 'should not assign any permissions' do
        expect(Roles::MergeToChild).not_to receive(:new)
        card_mover.call
      end

      context 'when to_collection is a foamcore board' do
        let!(:to_collection) do
          create(:board_collection,
                 num_cards: 3,
                 add_editors: [user],
                 organization: organization)
        end
        let(:placement) { 'end' }

        it 'places cards in their best fit after the last card' do
          card_mover.call
          to_collection.reload
          # they are all 1x1 so should fit consecutively
          expect(to_collection.collection_cards.last(3).pluck(:row, :col)).to eq([
            [3, 1],
            [3, 2],
            [3, 3],
          ])
        end
      end
    end

    context 'with to_collection.anyone_can_view' do
      let!(:from_collection) { create(:collection, organization: organization, num_cards: 1, record_type: :collection) }
      let(:subcollection) { from_collection.collections.first }
      before do
        to_collection.update(anyone_can_view: true)
      end

      it 'should call Sharing::PropagateAnyoneCanView on any collections being moved' do
        expect(Sharing::PropagateAnyoneCanView).to receive(:call).with(collection: subcollection)
        expect do
          card_mover.call
          subcollection.reload
        end.to change(subcollection, :anyone_can_view)
      end
    end

    context 'with data items that have legends' do
      let!(:data_item) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: from_collection,
        )
      end
      let(:legend_item) { data_item.legend_item }

      before do
        legend_item.reload # to make sure data_item_ids aren't cached
        moving_cards.push(data_item.parent_collection_card)
        user.add_role(Role::EDITOR, data_item)
      end

      it 'moves legend if not selected' do
        expect(
          to_collection.collection_cards.map(&:item).compact,
        ).not_to include(legend_item)
        expect {
          card_mover.call
        }.not_to change(Item::LegendItem, :count)
        expect(
          to_collection.collection_cards.reload.map(&:item).compact,
        ).to include(legend_item)
      end

      context 'with legend linked to other data items not moved' do
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
            card_mover.call
          }.to change(Item::LegendItem, :count).by(1)
        end

        it 'leaves existing data item linked to legend item' do
          card_mover.call
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

      context 'with card_action "link"' do
        let(:card_action) { 'link' }
        let(:linking_cards) { moving_cards }

        it 'adds legend to included cards if not included' do
          expect(
            to_collection.collection_cards.map(&:item).compact,
          ).not_to include(legend_item)
          card_mover.call
          expect(
            to_collection.collection_cards.reload.map(&:item).compact,
          ).to include(legend_item)
        end
      end
    end

    context 'with placement as row/col values, moving to a foamcore board' do
      let!(:to_collection) do
        create(:board_collection,
               num_cards: 3,
               add_editors: [user],
               organization: organization)
      end
      let(:placement) { Hashie::Mash.new(row: 2, col: 3) }

      it 'moves cards to targeted area' do
        card_mover.call
        # they are all 1x1 so should fit consecutively
        moving_cards.reload.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq 2
          expect(card.col).to eq 3 + index
        end
      end
    end

    context 'with invalid move' do
      let(:parent_collection) { create(:collection) }
      let(:parent_collection_card) { create(:collection_card, collection: parent_collection) }
      let(:to_parent_collection_card) { create(:collection_card, parent: from_collection) }
      let(:cards) { [to_parent_collection_card] }

      context 'moving inside itself' do
        let(:from_collection) do
          create(:collection, organization: organization, num_cards: 3, parent_collection_card: parent_collection_card)
        end
        let(:to_collection) do
          create(:collection, organization: organization, num_cards: 3, parent_collection_card: to_parent_collection_card)
        end

        it 'should produce errors' do
          expect(card_mover.call).to be false
          expect(card_mover.errors).to match_array ["You can't move a collection inside of itself."]
        end

        context 'when the card is a link card' do
          let(:link_card) { create(:collection_card_link, collection: from_collection, parent: from_collection) }
          let(:cards) { [link_card] }

          it 'should allow the move' do
            expect(card_mover.call).not_to be false
            expect(link_card.reload.parent).to eq to_collection
          end
        end
      end

      context 'moving between orgs' do
        let(:from_collection) do
          create(:collection, num_cards: 3, parent_collection_card: parent_collection_card)
        end
        let(:to_collection) do
          create(:collection, num_cards: 3, parent_collection_card: to_parent_collection_card)
        end

        it 'should produce errors' do
          expect(card_mover.call).to be false
          expect(card_mover.errors).to match_array ["You can't move a collection to a different organization."]
        end
      end
    end
  end
end
