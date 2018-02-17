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
        item.recalculate_breadcrumb!
      end

      it 'should populate breadcrumb from parent and self' do
        expect(item.breadcrumb.first).to match_array(Breadcrumb::Builder.for_object(collection))

        expect(item.breadcrumb.last).to match_array(Breadcrumb::Builder.for_object(item))
      end

      it 'should have parent and self' do
        expect(item.breadcrumb.size).to eq(2)
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
