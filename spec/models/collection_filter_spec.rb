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

    context 'if within(org/collection_id) is present' do
      let(:org_2) { create(:organization, slug: 'org-2') }
      let!(:duplicated_collection) { create(:collection, organization: org_2, cloned_from: collection_filter.collection) }
      before do
        collection_filter.update(
          text: "foo within(#{collection.organization.slug}/#{collection.id})",
        )
      end

      it 'changes reference to duplicated collection' do
        duplicate = collection_filter.duplicate!
        expect(duplicate.text).to eq(
          "foo within(#{org_2.slug}/#{duplicated_collection.id})",
        )
      end
    end
  end
end
