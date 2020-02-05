require 'rails_helper'

RSpec.describe CollectionCardDuplicationWorker, type: :worker do
  describe '#perform_sync' do
    let(:args) do
      [
        'batch-123',
        ['456'],
        '789',
      ]
    end

    it 'calls new.perform' do
      allow_any_instance_of(CollectionCardDuplicationWorker).to receive(:perform)
      expect_any_instance_of(CollectionCardDuplicationWorker).to receive(:perform).with(*args)
      CollectionCardDuplicationWorker.perform_sync(*args)
    end
  end

  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 5) }
    let(:to_collection) { create(:collection) }
    let(:cards) { collection.collection_cards }
    let(:card_ids) { cards.pluck(:id) }
    let(:system_collection) { false }
    let(:batch_id) { "duplicate-#{SecureRandom.hex(10)}" }
    let(:params) do
      [
        batch_id,
        card_ids,
        to_collection.id,
        user&.id,
        system_collection,
      ]
    end
    let(:run_worker) do
      CollectionCardDuplicationWorker.perform_sync(*params)
    end

    before do
      if user.present?
        Roles::MassAssign.call(
          object: collection,
          role_name: Role::EDITOR,
          users: [user],
          propagate_to_children: true,
          synchronous: true,
        )
      end
    end

    context 'with access to all items' do
      it 'clones all the collection cards' do
        run_worker
        to_collection.reload

        dupe_cards = to_collection.collection_cards
        original_cards = collection.collection_cards
        expect(dupe_cards.size).to eq(5)
        # check that cloned_from_ids match the originals, and in the same order
        expect(dupe_cards.map(&:record).map(&:cloned_from_id)).to eq original_cards.map(&:record).map(&:id)
        expect(dupe_cards.map(&:id)).not_to match_array(original_cards.map(&:id))
      end

      it 'clones all items' do
        expect {
          run_worker
        }.to change(CollectionCard, :count).by(5)
        to_collection.reload

        expect(to_collection.items.size).to eq(5)
        expect(to_collection.items.map(&:id)).not_to match_array(collection.items.map(&:id))
      end

      it 'marks collection as processing' do
        expect_any_instance_of(Collection).to receive(
          :update_processing_status,
        ).with(:duplicating).once

        expect_any_instance_of(Collection).to receive(
          :update_processing_status,
        ).with(nil).once

        run_worker
      end

      it 'broadcasts collection as stopped editing' do
        expect_any_instance_of(Collection).to receive(:processing_done)
        run_worker
      end

      it 'returns newly-duplicated cards' do
        result = run_worker
        expect(result).to eq(to_collection.collection_cards)
        expect(result.size).to eq(5)
      end

      context 'with pinned cards duplicating into a normal collection' do
        let(:collection) { create(:collection, master_template: true, pin_cards: true, num_cards: 1) }

        it 'should not pin the cards' do
          result = run_worker
          expect(result.any?(&:pinned)).to be false
        end
      end

      context 'with placeholder cards' do
        let!(:placeholders) do
          cards.map do |card|
            dup = card.amoeba_dup.becomes(CollectionCard::Placeholder)
            dup.type = 'CollectionCard::Placeholder'
            dup.save
            dup
          end
        end
        let(:card_ids) { placeholders.pluck(:id) }

        it 'copies the source parent cards from the card record' do
          expect {
            run_worker
          }.not_to change(CollectionCard, :count)

          new_cards = CollectionCard.where(id: card_ids)
          expect(new_cards.all?(&:primary?)).to be true
          expect(new_cards.map { |c| c.record.cloned_from }).to match_array(
            cards.map(&:record),
          )
        end
      end
    end

    context 'with no user provided' do
      let(:user) { nil }

      it 'clones all items' do
        expect_any_instance_of(Collection).to receive(:processing_done)
        run_worker
        to_collection.reload
        expect(to_collection.items.size).to eq(5)
      end
    end

    context 'with items you can\'t see' do
      let!(:hidden_item) { collection.items.first }
      let!(:viewable_items) { collection.items - [hidden_item] }
      let(:system_collection) { false }

      before do
        hidden_item.unanchor_and_inherit_roles_from_anchor!
        user.remove_role(Role::EDITOR, hidden_item)
        run_worker
        to_collection.reload
      end

      it 'duplicates only viewable items' do
        # Use cloned_from to get original items
        expect(to_collection.items.map(&:cloned_from)).to match_array(viewable_items)
        expect(to_collection.items(&:cloned_from)).not_to include(hidden_item)
      end

      context 'with a system collection' do
        let(:system_collection) { true }

        it 'duplicates all items' do
          expect(to_collection.items.map(&:cloned_from)).to match_array(collection.items)
        end
      end
    end

    context 'with data items that have legends' do
      let!(:data_item) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: collection,
        )
      end
      let(:legend_item) { data_item.legend_item }
      let(:duplicated_data_items) { to_collection.items.data_items }
      let(:default_moving_cards) { collection.collection_cards.first(2) }
      let!(:cards) { default_moving_cards + [data_item.parent_collection_card] }
      before do
        legend_item.reload # to make sure data_item_ids aren't cached
        user.add_role(Role::EDITOR, data_item)
      end

      it 'links legend to duplicated data item' do
        run_worker
        to_collection.reload.collection_cards
        expect(collection.items.data_items.size).to eq(1)
        expect(duplicated_data_items.size).to eq(1)
        expect(duplicated_data_items.first.cloned_from).to eq(data_item)
      end

      it 'duplicates legend' do
        expect(cards).not_to include(legend_item.parent_collection_card)
        expect {
          run_worker
        }.to change(Item::LegendItem, :count).by(1)
      end

      context 'if legend is selected' do
        let!(:cards) { default_moving_cards + [legend_item.parent_collection_card] }

        it 'duplicates it' do
          expect {
            run_worker
          }.to change(Item::LegendItem, :count).by(1)
        end
      end

      context 'with legend linked to other data items not duplicated' do
        let!(:data_item_two) do
          create(
            :data_item,
            :report_type_record,
            parent_collection: collection,
            legend_item: legend_item,
          )
        end

        before do
          user.add_role(Role::EDITOR, data_item_two)
        end

        it 'duplicates legend' do
          expect {
            run_worker
          }.to change(Item::LegendItem, :count).by(1)
        end

        it 'leaves existing data item linked to legend item' do
          run_worker
          to_collection_legend_items = to_collection.collection_cards.reload.select do |card|
            card.item&.is_a?(Item::LegendItem)
          end.map(&:item)
          expect(
            to_collection_legend_items.size,
          ).to eq(1)
          duplicated_legend_item = to_collection_legend_items.first
          expect(data_item_two.reload.legend_item).not_to eq(duplicated_legend_item)
        end
      end
    end
  end
end
