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
        expect(item.breadcrumb.first).to match_array(Breadcrumb::Builder.for_object(collection))

        expect(item.breadcrumb.last).to match_array(Breadcrumb::Builder.for_object(item))
      end

      it 'should have parent and self' do
        expect(item.breadcrumb.size).to eq(2)
      end

      it 'should not include user collection' do
        user_collection.recalculate_breadcrumb!
        user_collection_item.recalculate_breadcrumb!
        expect(user_collection.breadcrumb).to be_empty
        expect(user_collection_item.breadcrumb.size).to eq(1)
      end
    end
  end

  describe '#breadcrumb_viewable_by' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 1) }
    let!(:item) { collection.items.first }

    before do
      collection.recalculate_breadcrumb!
      item.recalculate_breadcrumb!
    end

    it 'should return nothing if no permissions' do
      expect(collection.breadcrumb_viewable_by(user)).to be_empty
      expect(item.breadcrumb_viewable_by(user)).to be_empty
    end

    context 'with only item viewable' do
      before do
        user.add_role(Role::VIEWER, item)
      end

      it 'should be item' do
        expect(collection.breadcrumb_viewable_by(user)).to be_empty
        expect(item.breadcrumb_viewable_by(user)).to match_array([Breadcrumb::Builder.for_object(item)])
      end
    end

    context 'with item and collection viewable' do
      before do
        user.add_role(Role::VIEWER, collection)
        user.add_role(Role::VIEWER, item)
      end

      it 'should be both if user added to collection and item' do
        breadcrumb = item.breadcrumb_viewable_by(user)
        expect(breadcrumb.first).to match_array(Breadcrumb::Builder.for_object(collection))
        expect(breadcrumb.last).to match_array(Breadcrumb::Builder.for_object(item))
      end
    end
  end

  describe '#breadcrumb_contains?' do
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
      expect(collection.breadcrumb_contains?(object: collection)).to be true
      expect(subcollection.breadcrumb_contains?(object: collection)).to be true
    end

    it 'returns true if klass, id are in the breadcrumb' do
      expect(collection.breadcrumb_contains?(klass: collection.class.name, id: collection.id)).to be true
      expect(subcollection.breadcrumb_contains?(klass: collection.class.name, id: collection.id)).to be true
    end

    it 'returns false if object is not in the breadcrumb' do
      expect(other_subcollection.breadcrumb_contains?(object: collection)).to be false
    end

    it 'returns false if klass, id are not in the breadcrumb' do
      expect(other_subcollection.breadcrumb_contains?(klass: collection.class.name, id: collection.id)).to be false
    end
  end

end
