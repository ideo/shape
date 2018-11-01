require 'rails_helper'

RSpec.describe CollectionCardDuplicationWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 5) }
    let(:duplicate) { create(:collection) }
    let(:card_ids) { collection.collection_cards.collect(&:id) }

    before do
      Roles::MassAssign.new(
        object: collection,
        role_name: Role::EDITOR,
        users: [user],
        propagate_to_children: true,
        synchronous: true,
      ).call
    end

    context 'with access to all items' do
      before do
        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          duplicate.id,
          user.id,
        )
        duplicate.reload
      end

      it 'clones all the collection cards' do
        dupe_cards = duplicate.collection_cards
        original_cards = collection.collection_cards
        expect(dupe_cards.size).to eq(5)
        # check that cloned_from_ids match the originals, and in the same order
        expect(dupe_cards.map(&:record).map(&:cloned_from_id)).to eq original_cards.map(&:record).map(&:id)
        expect(dupe_cards.map(&:id)).not_to match_array(original_cards.map(&:id))
      end

      it 'clones all items' do
        expect(duplicate.items.size).to eq(5)
        expect(duplicate.items.map(&:id)).not_to match_array(collection.items.map(&:id))
      end

      it 'marks collection as processing' do
        expect_any_instance_of(Collection).to receive(
          :update_processing_status,
        ).with(
          Collection.processing_statuses[:duplicating]
        ).once

        expect_any_instance_of(Collection).to receive(
          :update_processing_status,
        ).with(nil).once

        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          duplicate.id,
          user.id,
        )
      end

      it 'broadcasts collection as stopped editing' do
        expect_any_instance_of(Collection).to receive(:processing_done)
        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          duplicate.id,
          user.id,
        )
      end

      it 'clones all items if user not provided' do
        expect_any_instance_of(Collection).to receive(:processing_done)
        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          duplicate.id,
        )
      end
    end

    context 'with items you can\'t see' do
      let!(:hidden_item) { collection.items.first }
      let!(:viewable_items) { collection.items - [hidden_item] }

      before do
        user.remove_role(Role::EDITOR, hidden_item)
        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          duplicate.id,
          user.id,
        )
        duplicate.reload
      end

      it 'duplicates only viewable items' do
        # Use cloned_from to get original items
        expect(duplicate.items.map(&:cloned_from)).to match_array(viewable_items)
        expect(duplicate.items(&:cloned_from)).not_to include(hidden_item)
      end
    end
  end
end
