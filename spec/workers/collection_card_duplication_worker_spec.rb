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
          user.id,
          duplicate.id,
        )
        duplicate.reload
      end

      it 'clones all the collection cards' do
        expect(duplicate.collection_cards.size).to eq(5)
        expect(collection.collection_cards.map(&:id)).not_to match_array(duplicate.collection_cards.map(&:id))
      end

      it 'clones all items' do
        expect(duplicate.items.size).to eq(5)
        expect(collection.items.map(&:id)).not_to match_array(duplicate.items.map(&:id))
      end
    end

    context 'with items you can\'t see' do
      let!(:hidden_item) { collection.items.first }
      let!(:viewable_items) { collection.items - [hidden_item] }

      before do
        user.remove_role(Role::EDITOR, hidden_item)
        CollectionCardDuplicationWorker.new.perform(
          card_ids,
          user.id,
          duplicate.id,
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
