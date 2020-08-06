require 'rails_helper'

RSpec.describe CollectionGrid::BoardMigrator, type: :service do
  let(:collection) { create(:collection, num_cards: 3) }
  let(:cards) { collection.collection_cards }

  subject do
    CollectionGrid::BoardMigrator.new(
      collection: collection,
    )
  end

  describe '#call' do
    context 'normal collection' do
      before do
        cards.update_all(row: nil, col: nil)
        cards[0].update(width: 2, height: 1)
        cards[1].update(width: 1, height: 2)
        cards[2].update(width: 2, height: 2)
      end

      it 'migrates cards to row/col positions, and sets order to 0' do
        expect(cards.pluck(:row, :col).flatten.compact).to be_empty
        subject.call
        expect(cards.pluck(:order, :row, :col)).to eq([
          [0, 0, 0],
          [0, 0, 2],
          [0, 1, 0],
        ])
      end

      it 'updates collection to 4 columns' do
        expect(collection.board_collection?).to be false
        expect(collection.num_columns).to be nil
        subject.call
        expect(collection.board_collection?).to be true
        expect(collection.num_columns).to eq 4
      end
    end

    context 'with subcollections' do
      let!(:subcollections) { create_list(:collection, 2, num_cards: 2, parent_collection: collection) }

      it 'migrates all subcollections as well' do
        subject.call
        subcollections.each do |coll|
          expect(coll.collection_cards.pluck(:order, :row, :col)).to eq([
            [0, 0, 0],
            [0, 0, 1],
          ])
        end
      end

      context 'with a collection that\'s already a board collection' do
        let(:collection) { create(:collection, num_columns: 4) }
        let!(:subcollections) { create_list(:collection, 2, num_cards: 2, parent_collection: collection) }

        it 'skips migration on parent but still runs on subcollections' do
          allow(CollectionGrid::Calculator).to receive(:calculate_rows_cols).and_call_original
          expect(CollectionGrid::Calculator).to receive(:calculate_rows_cols).twice
          subject.call
          subcollections.each do |coll|
            expect(coll.collection_cards.pluck(:order, :row, :col)).to eq([
              [0, 0, 0],
              [0, 0, 1],
            ])
          end
        end
      end
    end
  end
end
