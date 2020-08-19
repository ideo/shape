require 'rails_helper'

RSpec.describe BulkCardOperationProcessor, type: :service do
  let(:user) { create(:user) }
  let(:from_collection) { create(:collection, num_cards: 3) }
  let(:to_collection) { create(:collection, num_cards: 1) }
  let(:cards) { from_collection.collection_cards }
  let(:action) { 'duplicate' }
  let(:placement) { Hashie::Mash.new(row: 3, col: 2) }

  subject do
    BulkCardOperationProcessor.new(
      cards: cards,
      action: action,
      placement: placement,
      to_collection: to_collection,
      for_user: user,
    )
  end

  describe '#call' do
    it 'should create a placeholder card in the to_collection' do
      expect {
        subject.call
      }.to change(CollectionCard::Placeholder, :count).by(1)
      expect(to_collection.collection_cards.pluck(:type, :row, :col)).to eq([
        ['CollectionCard::Primary', 0, 0],
        ['CollectionCard::Placeholder', 3, 2],
      ])
    end

    context 'on a foamcore board' do
      let(:to_collection) { create(:board_collection, num_cards: 1) }
      before do
        # assign this a fixed value
        to_collection.collection_cards.first.update(row: 1, col: 1)
      end

      it 'should create a placeholder card with row/col' do
        expect {
          subject.call
        }.to change(CollectionCard::Placeholder, :count).by(1)
        expect(to_collection.collection_cards.pluck(:type, :row, :col)).to eq([
          ['CollectionCard::Primary', 1, 1],
          ['CollectionCard::Placeholder', 3, 2],
        ])
      end
    end

    it 'should create a text item describing the bulk operation' do
      placeholder = subject.call
      expect(placeholder.persisted?).to be true
      expect(placeholder.item.is_a?(Item::TextItem)).to be true
      expect(placeholder.item.content).to include("Bulk #{action} operation (#{cards.count} cards)")
    end

    it 'should queue the bulk action' do
      expect(BulkCardOperationWorker).to receive(:perform_in).with(
        1.second,
        cards.pluck(:id),
        action,
        anything, # TBD placeholder id
        user.id,
      )
      subject.call
    end
  end
end
