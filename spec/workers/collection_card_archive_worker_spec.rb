require 'rails_helper'

RSpec.describe CollectionCardArchiveWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection) }
    let(:collection_card_collections) do
      create_list(:collection_card_collection, 2, parent: collection)
    end
    let(:collection_card_items) do
      create_list(:collection_card_text, 2, parent: collection)
    end
    let!(:subcollection_card) do
      # Add item to collection so we can test notifications on non-empty collections
      # Don't include subcollection card in array of cards,
      # as it will get archived before it can be accessed
      create(:collection_card_text,
             parent: collection_card_collections.first.collection)
    end
    let!(:collection_cards) do
      collection_card_collections + collection_card_items
    end
    let(:run_worker) do
      CollectionCardArchiveWorker.new.perform(
        collection_cards.map(&:id),
        user.id,
      )
    end

    before do
      user.add_role(Role::EDITOR, collection)
    end

    context 'with collection cards' do
      before do
        collection_card_collections.each do |card|
          create(:activity, actor: user, target: card.record, action: 6)
        end
        create(:activity, actor: user, target: subcollection_card.record, action: 6)
      end

      it 'archives all cards and their records' do
        run_worker
        collection_cards.each(&:reload)
        expect(collection_cards.map(&:archived?).all?).to be true
        expect(collection_cards.map(&:record).map(&:archived?).all?).to be true
      end

      it 'notifies the relevant users' do
        collection_cards.each do |card|
          builder_args = {
            actor: user,
            target: card.record,
            action: :archived,
            subject_user_ids: [user.id],
            subject_group_ids: [],
          }

          if card.collection.present? && card.collection.children.present?
            expect(ActivityAndNotificationBuilder).to receive(:call).with(builder_args)
          else
            # Users are not notified about items or empty collections
            expect(ActivityAndNotificationBuilder).not_to receive(:call).with(builder_args)
          end
        end
        run_worker
      end
    end

    context 'with a collection you did not participate in' do
      it 'should not notifiy you' do
        expect(ActivityAndNotificationBuilder).not_to receive(:call)
        run_worker
      end
    end

    context 'participated in an item in a sub collection' do
      let(:run_worker) do
        CollectionCardArchiveWorker.new.perform(
          [collection_card_collections.first.id],
          user.id,
        )
      end
      let!(:activity) { create(:activity, actor: user, target: subcollection_card.record, action: 6) }

      let(:builder_args) do
        {
          actor: user,
          target: anything,
          action: :archived,
          subject_user_ids: [user.id],
          subject_group_ids: [],
        }
      end

      it 'should notify you' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(builder_args)
        run_worker
      end
    end
  end
end
