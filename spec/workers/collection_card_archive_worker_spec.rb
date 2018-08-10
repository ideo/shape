require 'rails_helper'

RSpec.describe CollectionCardArchiveWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection) }
    let(:collection_cards) { create_list(:collection_card_collection, 2, parent: collection) }
    let(:run_worker) do
      CollectionCardArchiveWorker.new.perform(
        collection_cards.map(&:id),
        user.id,
      )
    end

    before do
      collection_cards.each do |card|
        user.add_role(Role::EDITOR, card.collection)
      end
    end

    context 'with collection cards' do
      it 'archives all cards and their records' do
        run_worker
        collection_cards.each(&:reload)
        expect(collection_cards.map(&:archived?).all?).to be true
        expect(collection_cards.map(&:record).map(&:archived?).all?).to be true
      end

      it 'notifies the relevant users' do
        collection_cards.each do |card|
          expect(ActivityAndNotificationBuilder).to receive(:call).with(
            actor: user,
            target: card.record,
            action: :archived,
            subject_user_ids: [user.id],
            subject_group_ids: [],
          )
        end
        run_worker
      end
    end
  end
end
