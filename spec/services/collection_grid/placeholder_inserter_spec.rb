require 'rails_helper'

RSpec.describe CollectionGrid::PlaceholderInserter, type: :service do
  let(:collection) { create(:collection) }
  let(:row) { 0 }
  let(:col) { 0 }
  let(:count) { 2 }
  let(:service) {
    CollectionGrid::PlaceholderInserter.new(
      row: row,
      col: col,
      count: count,
      collection: collection,
    )
  }
  let(:placeholders) { service.call }

  it 'should create two placeholders with different positions' do
    expect(placeholders[0].col).not_to eq(placeholders[1].col)
  end
end
