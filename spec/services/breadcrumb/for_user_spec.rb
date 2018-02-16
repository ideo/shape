require 'rails_helper'

RSpec.describe Breadcrumb::ForUser, type: :service do
  let(:user) { create(:user) }
  let!(:collection) { create(:collection) }
  let!(:subcollection) { create(:collection, num_cards: 1) }
  let!(:item) { subcollection.items.first }
  let(:collection_breadcrumb) do
    # Use .last to only get last item in breadcrumb
    Breadcrumb::Builder.new(collection).call.last
  end
  let(:subcollection_breadcrumb) do
    Breadcrumb::Builder.new(subcollection).call.last
  end
  let(:item_breadcrumb) do
    Breadcrumb::Builder.new(item).call.last
  end

  before do
    collection.collection_cards.create!(
      collection: subcollection
    )
    item.recalculate_breadcrumb!
  end

  describe '#call' do
    it 'returns empty breadcrumb if user has no access' do
      expect(Breadcrumb::ForUser.new(item.breadcrumb, user).call).to eq([])
    end

    context 'with full access to parents' do
      before do
        user.add_role(Role::VIEWER, collection)
      end

      it 'should return full breadcrumb' do
        expect(Breadcrumb::ForUser.new(item.breadcrumb, user).call).to match_array([
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
        expect(Breadcrumb::ForUser.new(item.breadcrumb, user).call).to match_array([
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
        expect(Breadcrumb::ForUser.new(item.breadcrumb, user).call).to match_array([
          item_breadcrumb,
        ])
      end
    end
  end

  describe '#to_api' do
    before do
      user.add_role(Role::VIEWER, collection)
    end

    it 'should have full length breadcrumb' do
      expect(Breadcrumb::ForUser.new(item.breadcrumb, user).to_api.size).to eq(3)
    end

    it 'should have pluralize, underscored items' do
      breadcrumb = Breadcrumb::ForUser.new(item.breadcrumb, user).to_api
      expect(breadcrumb.first[0]).to eq('collections')
      expect(breadcrumb.last[0]).to eq('items')
    end
  end
end
