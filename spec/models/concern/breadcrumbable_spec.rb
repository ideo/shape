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
        expect(item.breadcrumb.first).to match_array(Breadcrumb::Builder.new(collection).call.last)

        expect(item.breadcrumb.last).to match_array(Breadcrumb::Builder.new(item).call.last)
      end

      it 'should have parent and self' do
        expect(item.breadcrumb.size).to eq(2)
      end
    end
  end
end
