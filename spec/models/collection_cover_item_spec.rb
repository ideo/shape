require 'rails_helper'

RSpec.describe CollectionCoverItem, type: :model do
  describe 'validations' do
    let!(:collection_cover_item) { create(:collection_cover_item) }

    it 'does not allow duplicate per collection-item combo' do
      duped = collection_cover_item.dup
      expect { duped.save }.not_to change(CollectionCoverItem, :count)
    end
  end

  describe '#create' do
    let(:collection_cover_item) { create(:collection_cover_item) }

    it 'saves record' do
      expect(collection_cover_item.persisted?).to be true
    end
  end
end
