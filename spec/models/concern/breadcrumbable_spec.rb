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
    # TODO: write tests
  end

  describe '#can_view?' do
    # TODO: write tests
  end

  describe '#can_edit?' do
    # TODO: write tests
  end
end
