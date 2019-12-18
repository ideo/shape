require 'rails_helper'

RSpec.describe CollectionCardDuplicationWorker, type: :worker do
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
      CollectionCardDuplicationWorker.new.perform(*params)
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
  end
end
