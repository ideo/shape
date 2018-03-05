require 'rails_helper'

RSpec.describe Item, type: :model do
  context 'validations' do
    it { should validate_presence_of(:type) }
  end

  context 'associations' do
    it { should have_one :parent_collection_card }
    it { should have_many :collection_cards }
    it { should belong_to :filestack_file }
  end

  describe '#duplicate!' do
    let!(:item) { create(:text_item) }

    it 'clones the item' do
      expect { item.duplicate! }.to change(Item, :count).by(1)
      expect(item.duplicate!).not_to eq(item)
    end

    context 'with parent collection card' do
      let!(:parent_collection_card) do
        create(:collection_card_item, item: item)
      end
      let!(:duplicate) { item.duplicate! }

      it 'does not duplicate if no flag passed' do
        expect(duplicate.parent_collection_card).to be_nil
      end

      it 'duplicates parent' do
        dupe = item.duplicate!(copy_parent_card: true)
        expect(dupe.id).not_to eq(item.parent_collection_card.id)
      end

      it 'increases the order by 0.5' do
        dupe = item.duplicate!(copy_parent_card: true)
        expect(dupe.parent_collection_card.order).to eq(item.parent_collection_card.order + 0.5)
      end
    end
  end
end
