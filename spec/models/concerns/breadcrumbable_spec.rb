require 'rails_helper'

describe Breadcrumbable, type: :concern do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Breadcrumbable)
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
        expect(item.breadcrumb).to match_array([collection.id])
      end

      it 'should not include user collection' do
        user_collection.recalculate_breadcrumb!
        user_collection_item.recalculate_breadcrumb!
        expect(user_collection.breadcrumb).to be_empty
        expect(user_collection_item.breadcrumb).to be_empty
      end
    end
  end

  describe '#breadcrumb_viewable_by' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 1) }
    let(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let(:subcollection) { subcollection_card.collection }
    let!(:subcollection_item_card) { create(:collection_card_text, parent: subcollection) }
    let(:item) { subcollection.items.first }

    before do
      collection.recalculate_breadcrumb!
      subcollection.recalculate_breadcrumb!
      item.recalculate_breadcrumb!
    end

    it 'should return nothing if no permissions' do
      expect(collection.breadcrumb_viewable_by(user)).to be_empty
      expect(item.breadcrumb_viewable_by(user)).to be_empty
    end

    context 'with only item viewable' do
      before do
        user.add_role(Role::VIEWER, subcollection)
        user.add_role(Role::VIEWER, item)
      end

      it 'should be item' do
        expect(collection.breadcrumb_viewable_by(user)).to be_empty
        expect(item.breadcrumb_viewable_by(user)).to match_array [subcollection.id]
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
      expect(collection.within_collection_or_self?(collection)).to be true
      expect(subcollection.within_collection_or_self?(collection)).to be true
    end

    it 'returns false if object is not in the breadcrumb' do
      expect(other_subcollection.within_collection_or_self?(collection)).to be false
    end
  end
end
