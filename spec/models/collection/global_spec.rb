require 'rails_helper'

describe Collection::Global, type: :model do
  describe '#org_templates?' do
    let(:organization) { create(:organization) }
    let(:collection) { create(:global_collection, organization: organization) }

    before do
      organization.update(template_collection_id: collection.id)
    end

    it 'should be true if the org template collection id is itself' do
      expect(collection.org_templates?).to be true
    end
  end

  context 'profile collection' do
    let(:organization) { create(:organization) }
    let(:collection) do
      create(:global_collection, num_cards: 3, record_type: :collection, organization: organization)
    end
    let(:subcollections) { collection.collections }

    before do
      organization.update(profile_collection_id: collection.id)
      subcollections[0].update(name: 'Xyzo')
      subcollections[1].update(name: 'lala')
      subcollections[2].update(name: 'AbCd')
    end

    describe '#profiles?' do
      it 'should be true if the org profile collection id is itself' do
        expect(collection.profiles?).to be true
      end
    end

    describe '#reorder_cards!' do
      it 'should override default reordering to use reorder_cards_by_collection_name!' do
        collection.reorder_cards!
        expect(collection.collection_cards.map(&:order)).to eq(
          [0, 1, 2],
        )
        expect(collection.collection_cards.map(&:record).map(&:name)).to eq(
          %w[AbCd lala Xyzo],
        )
      end
    end
  end
end
