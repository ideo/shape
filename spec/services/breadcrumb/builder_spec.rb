require 'rails_helper'

RSpec.describe Breadcrumb::Builder, type: :service do
  describe '#call' do
    let(:collection) { create(:collection, num_cards: 1) }
    let!(:item) { collection.items.first }
    let(:breadcrumb) do
      Breadcrumb::Builder.new(item).call
    end

    it 'should have breadcrumb from parent collection' do
      expect(breadcrumb.first).to match_array([
        'Collection',
        collection.id,
        collection.name,
      ])
    end

    it 'should have breadcrumb for item' do
      expect(breadcrumb.last).to match_array([
        'Item',
        item.id,
        item.name,
      ])
    end

    it 'should have parent and self' do
      expect(breadcrumb.size).to eq(2)
    end
  end
end
