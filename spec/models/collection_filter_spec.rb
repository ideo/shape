require 'rails_helper'

RSpec.describe CollectionFilter, type: :model do
  describe '#duplicate!' do
    let!(:collection_filter) { create(:collection_filter) }
    let(:collection) { collection_filter.collection }
    before do
      collection.organization.update(slug: 'org-1')
    end

    it 'creates a copy' do
      expect { collection_filter.duplicate! }.to change(CollectionFilter, :count).by(1)
    end
  end

  describe '#reassign_within!' do
    let(:from_collection) { create(:collection) }
    let(:to_collection) { create(:collection) }
    let!(:collection_filter) { create(:collection_filter, collection: from_collection) }
    before do
      from_collection.organization.update(slug: 'org-from')
      to_collection.organization.update(slug: 'org-to')
      collection_filter.update(
        text: "foo within(org-from/#{from_collection.id})",
      )
    end

    it 'changes reference to duplicated collection' do
      expect(collection_filter.within_collection_id).to eq(from_collection.id)
      collection_filter.reassign_within!(
        from_collection_id: from_collection.id,
        to_collection_id: to_collection.id,
      )
      expect(collection_filter.text).to eq(
        "foo within(org-to/#{to_collection.id})",
      )
      expect(collection_filter.within_collection_id).to eq(to_collection.id)
    end
  end
end
