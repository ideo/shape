require 'rails_helper'

RSpec.describe CollectionFilter, type: :model do
  context 'associations' do
    it { should belong_to(:collection).touch(true) }
    it { should have_many(:user_collection_filters).dependent(:destroy) }
  end

  describe '#duplicate!' do
    let!(:collection_filter) { create(:collection_filter) }
    let(:collection) { collection_filter.collection }
    let(:new_collection) { create(:collection) }
    before do
      collection.organization.update(slug: 'org-1')
    end

    it 'creates a copy' do
      expect { collection_filter.duplicate!(assign_collection: new_collection) }.to change(CollectionFilter, :count).by(1)
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
        text: "foo within:#{from_collection.id} xyz",
      )
    end

    it 'changes reference to duplicated collection' do
      expect(collection_filter.within_collection_id).to eq(from_collection.id)
      collection_filter.reassign_within!(
        from_collection_id: from_collection.id,
        to_collection_id: to_collection.id,
      )
      expect(collection_filter.text).to eq(
        "foo within:#{to_collection.id} xyz",
      )
      expect(collection_filter.within_collection_id).to eq(to_collection.id)
    end
  end
end
