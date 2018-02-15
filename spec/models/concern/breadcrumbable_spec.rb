require 'rails_helper'

describe Item, type: :model do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Breadcrumbable)
  end

  describe 'callbacks' do
    describe '#calculate_breadcrumb' do
      let(:collection) { create(:collection, num_cards: 1) }
      let!(:item) { collection.items.first }

      before do
        item.save # trigger breadcrumb creation
      end

      it 'should populate breadcrumb from parent and self' do
        expect(item.breadcrumb.first).to match_array([
          Role.object_identifier(collection),
          collection.name
        ])

        expect(item.breadcrumb.last).to match_array([
          Role.object_identifier(item),
          item.name
        ])
      end

      it 'should have parent and self' do
        expect(item.breadcrumb.size).to eq(2)
      end
    end
  end

  describe '#breadcrumb_for_user' do
    let(:user) { create(:user) }
    let!(:collection) { create(:collection) }
    let!(:subcollection) { create(:collection, num_cards: 1) }
    let!(:item) { subcollection.items.first }
    let(:collection_breadcrumb) { collection.breadcrumb_data }
    let(:subcollection_breadcrumb) { subcollection.breadcrumb_data }
    let(:item_breadcrumb) { item.breadcrumb_data }

    before do
      collection.collection_cards.create!(
        collection: subcollection
      )
      item.reset_breadcrumb!
      item.save
    end

    it 'with no access, should return empty breadcrumb' do
      expect(item.breadcrumb_for_user(user)).to be_empty
    end

    context 'with full access to parents' do
      before do
        user.add_role(Role::VIEWER, collection)
      end

      it 'should return full breadcrumb' do
        expect(item.breadcrumb_for_user(user)).to match_array([
          collection_breadcrumb,
          subcollection_breadcrumb,
          item_breadcrumb,
        ])
      end
    end

    context 'with access to only direct ancestor' do
      before do
        user.add_role(Role::VIEWER, subcollection)
      end

      it 'should return breadcrumb with direct ancestor and item' do
        expect(item.breadcrumb_for_user(user)).to match_array([
          subcollection_breadcrumb,
          item_breadcrumb,
        ])
      end
    end

    context 'with access only to item' do
      before do
        user.add_role(Role::VIEWER, item.becomes(Item))
      end

      it 'should return breadcrumb with only item' do
        expect(item.breadcrumb_for_user(user)).to match_array([
          item_breadcrumb,
        ])
      end
    end
  end
end
