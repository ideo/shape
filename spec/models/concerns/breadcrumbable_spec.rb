require 'rails_helper'

describe Breadcrumbable, type: :concern do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Breadcrumbable)
    expect(Collection.ancestors).to include(Breadcrumbable)
  end

  describe 'callbacks' do
    describe '#calculate_breadcrumb' do
      let(:collection) { create(:collection, num_cards: 1) }
      let!(:item) { collection.items.first }
      let(:user_collection) { create(:user_collection, num_cards: 1) }
      let(:user_collection_item) { user_collection.items.first }

      before do
        item.recalculate_breadcrumb!
      end

      it 'should populate breadcrumb from parent and self' do
        expect(item.breadcrumb).to eq [collection.id]
      end

      it 'should not include user collection' do
        user_collection.recalculate_breadcrumb!
        user_collection_item.recalculate_breadcrumb!
        expect(user_collection.breadcrumb).to be_empty
        expect(user_collection_item.breadcrumb).to be_empty
      end
    end
  end

  context 'with nested items' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 1) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let(:subcollection) { subcollection_card.collection }
    let!(:subcollection_item_card) { create(:collection_card_text, parent: subcollection) }
    let(:item) { subcollection_item_card.record }

    describe '#breadcrumb_viewable_by' do
      it 'should return nothing if no permissions' do
        expect(collection.breadcrumb_viewable_by(user)).to be_empty
        expect(item.breadcrumb_viewable_by(user)).to be_empty
      end

      context 'with only item viewable' do
        before do
          subcollection.unanchor_and_inherit_roles_from_anchor!
          item.unanchor_and_inherit_roles_from_anchor!
          user.add_role(Role::VIEWER, subcollection)
          user.add_role(Role::VIEWER, item)
        end

        it 'should be item' do
          expect(collection.breadcrumb_viewable_by(user)).to be_empty
          expect(item.breadcrumb_viewable_by(user)).to eq [subcollection.id]
        end
      end

      context 'with item and collection viewable' do
        before do
          user.add_role(Role::VIEWER, collection)
          user.add_role(Role::VIEWER, item)
        end

        it 'should be both if user added to collection and item' do
          breadcrumb = item.breadcrumb_viewable_by(user)
          expect(breadcrumb.first).to eq collection.id
          expect(breadcrumb.last).to eq subcollection.id
        end
      end
    end

    describe '#recalculate_breadcrumb_tree!' do
      let(:other_collection) { create(:collection) }
      let!(:parent_collection_card) { create(:collection_card, parent: other_collection, collection: collection) }

      it 'updates breadcrumbs of all children' do
        expect(subcollection.breadcrumb).to eq [collection.id]
        expect(item.breadcrumb).to eq [collection.id, subcollection.id]
        collection.recalculate_breadcrumb_tree!(force_sync: true)
        expect(subcollection.reload.breadcrumb).to eq [other_collection.id, collection.id]
        expect(item.reload.breadcrumb).to eq [other_collection.id, collection.id, subcollection.id]
      end
    end
  end

  describe '#within_collection_or_self?' do
    let(:collection) { create(:collection) }
    let(:collection_card) { create(:collection_card_collection, parent: collection) }
    let(:other_collection_card) { create(:collection_card_collection) }
    let(:subcollection) { collection_card.collection }
    let(:other_subcollection) { other_collection_card.collection }

    before do
      collection.recalculate_breadcrumb!
      subcollection.recalculate_breadcrumb!
      other_subcollection.recalculate_breadcrumb!
    end

    it 'returns true if object is in the breadcrumb' do
      expect(collection.within_collection_or_self?(collection.id)).to be true
      expect(subcollection.within_collection_or_self?(collection.id)).to be true
    end

    it 'returns false if object is not in the breadcrumb' do
      expect(other_subcollection.within_collection_or_self?(collection.id)).to be false
    end
  end

  describe '#parent_ids' do
    let(:parent) { create(:collection) }
    let(:collection) { create(:collection, parent_collection: parent) }
    let(:item) { create(:text_item, parent_collection: parent) }

    it 'includes parent collection ids' do
      expect(collection.search_data[:parent_ids]).to eq([parent.id])
      expect(item.search_data[:parent_ids]).to eq([parent.id])
    end

    context 'if linked' do
      let(:linked_collection) { create(:collection) }
      let!(:link_card) { create(:collection_card_link, parent: linked_collection, collection: collection) }
      let!(:link_item_card) { create(:collection_card_link, parent: linked_collection, item: item) }
      before do
        # refresh relationships
        collection.reload
        item.reload
      end

      it 'includes parents where it was linked' do
        expect(collection.parent_ids).to match_array(
          [parent.id, linked_collection.id],
        )
        expect(item.parent_ids).to match_array(
          [parent.id, linked_collection.id],
        )
      end
    end
  end

  describe '#detect_infinite_loop' do
    let(:collection) { create(:collection) }
    context 'with long breadcrumb' do
      before do
        # have to fake this because the model callbacks will override the actual breadcrumb
        allow(collection).to receive(:breadcrumb).and_return(
          (1..60).to_a,
        )
      end

      it 'returns breadcrumb errors' do
        expect(collection.save).to be false
        expect(collection.errors[:breadcrumb]).to eq ['too long']
      end
    end

    context 'with repeating parent names' do
      let(:parents) do
        [
          Mashie.new(name: 'prototype collection'),
          Mashie.new(name: 'Inner contents'),
          Mashie.new(name: 'Working agreements'),
        ]
      end

      before do
        allow(collection).to receive(:breadcrumb).and_return(
          # just has to be not nil
          [1, 2],
        )
        allow(collection).to receive(:parents).and_return(
          # repeat the same names several times
          # there are only 3 unique vs 9 total, which will cause an error
          parents * 3,
        )
      end

      it 'returns breadcrumb errors' do
        expect(collection.save).to be false
        expect(collection.errors[:breadcrumb]).to eq ['repeating parent names']
      end
    end
  end
end
