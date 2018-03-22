require 'rails_helper'

RSpec.describe Item, type: :model do
  context 'validations' do
    it { should validate_presence_of(:type) }
  end

  context 'associations' do
    it { should have_one :parent_collection_card }
    it { should have_many :reference_collection_cards }
    it { should belong_to :filestack_file }
    it { should belong_to :cloned_from }
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:item) { create(:text_item) }
    let(:copy_parent_card) { false }
    let(:duplicate) do
      item.duplicate!(
        for_user: user,
        copy_parent_card: copy_parent_card,
      )
    end

    it 'clones the item' do
      expect { duplicate }.to change(Item, :count).by(1)
      expect(duplicate).not_to eq(item)
    end

    it 'references the current item as cloned_from' do
      expect(duplicate.cloned_from).to eq(item)
    end

    context 'with parent collection card' do
      let!(:parent_collection_card) do
        create(:collection_card_item, item: item)
      end

      it 'does not duplicate if no copy_parent_card is false' do
        expect(duplicate.parent_collection_card).to be_nil
      end

      context 'copy_parent_card true' do
        let!(:copy_parent_card) { true }

        it 'duplicates parent' do
          expect(duplicate.id).not_to eq(item.parent_collection_card.id)
        end

        it 'increases the order by 1' do
          expect(duplicate.parent_collection_card.order).to eq(item.parent_collection_card.order + 1)
        end
      end
    end

    context 'with filestack file' do
      let!(:filestack_file) { create(:filestack_file) }

      before do
        item.update_attributes(filestack_file: filestack_file)
      end

      it 'duplicates the filestack file' do
        expect { duplicate }.to change(FilestackFile, :count).by(1)
      end
    end
  end
end
