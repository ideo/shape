require 'rails_helper'

RSpec.describe Breadcrumb::Builder, type: :service do
  describe '#call' do
    let(:collection) { create(:collection, num_cards: 1) }
    let!(:item) { collection.items.first }
    let(:breadcrumb) do
      Breadcrumb::Builder.call(item)
    end

    it 'should have breadcrumb from parent collection' do
      expect(breadcrumb).to match_array([collection.id])
    end

    context 'with subcollection' do
      let!(:card) { create(:collection_card_collection, parent: collection) }
      let(:subcollection) { card.collection }
      let(:item) { create(:collection_card_text, parent: subcollection).item }

      before do
        subcollection.recalculate_breadcrumb!
      end

      it 'should have breadcrumb for item' do
        expect(breadcrumb).to match_array([
          collection.id,
          subcollection.id,
        ])
      end

      it 'should have collection and subcollection' do
        expect(breadcrumb.size).to eq(2)
      end
    end

    context 'in a submissions collection' do
      let(:submission_box) { create(:submission_box) }
      let(:collection) { create(:submissions_collection, num_cards: 1, submission_box: submission_box) }

      it 'should have breadcrumb from submission box collection, skipping submissions collection' do
        expect(breadcrumb).to match_array([submission_box.id])
      end
    end

    describe '.in_collection' do
      let!(:subcollections) { create_list(:collection, 2, num_cards: 2, parent_collection: collection) }

      before do
        subcollections.each { |c| c.items.each(&:recalculate_breadcrumb!) }
      end

      it 'should find all subcollections in the tree' do
        expect(Collection.in_collection(collection).count).to eq 2
        expect(Collection.in_collection(collection)).to include(subcollections.first)
      end

      it 'should find all items in the tree' do
        expect(Item.in_collection(collection).count).to eq 5
        expect(Item.in_collection(collection)).to include(subcollections.first.items.first)
      end
    end
  end
end
