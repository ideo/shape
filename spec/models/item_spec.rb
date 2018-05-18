require 'rails_helper'

RSpec.describe Item, type: :model do
  context 'validations' do
    it { should validate_presence_of(:type) }
  end

  context 'associations' do
    it { should have_one :parent_collection_card }
    it { should have_many :cards_linked_to_this_item }
    it { should belong_to :filestack_file }
    it { should belong_to :cloned_from }
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:collection) { create(:collection, num_cards: 1) }
    let(:item) { collection.items.first }
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

    it 'does not duplicate if no copy_parent_card is false' do
      expect(duplicate.parent_collection_card).to be_nil
    end

    context 'with roles' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'copies the roles from its parent collection' do
        expect(duplicate.can_edit?(user)).to be true
      end
    end

    context 'copy_parent_card true' do
      let!(:copy_parent_card) { true }

      it 'duplicates parent' do
        expect(duplicate.parent_collection_card.id).not_to eq(item.parent_collection_card.id)
      end

      it 'increases the order by 1' do
        expect(duplicate.parent_collection_card.order).to eq(item.parent_collection_card.order + 1)
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

  describe '#update_parent_collection_if_needed' do
    let!(:collection) { create(:collection, num_cards: 2) }
    let!(:item) { collection.collection_cards.first.item }
    let!(:second_item) { collection.collection_cards.second.item }

    before do
      collection.cache_cover!
    end

    it 'will update the collection cover if needed' do
      item.text_data = { ops: [{ insert: 'Howdy doody.' }] }
      item.update_parent_collection_if_needed
      expect(collection.cached_cover['item_id_text']).to eq item.id
      expect(collection.cached_cover['text']).to eq item.plain_content
    end

    it 'will not update the collection cover if not needed' do
      second_item.text_data = { ops: [{ insert: 'Lorem ipsum 123.' }] }
      second_item.update_parent_collection_if_needed
      expect(collection.cached_cover['item_id_text']).not_to eq second_item.id
      expect(collection.cached_cover['text']).not_to eq second_item.plain_content
    end
  end

  describe '#cache_attributes' do
    let(:tag_list) { %w[testing prototyping] }
    let(:item) { create(:image_item) }

    it 'caches tag_list onto cached_attributes' do
      expect(item.cached_tag_list).to eq []
      item.update(tag_list: tag_list)
      expect(item.cached_tag_list).to match_array(tag_list)
    end

    it 'caches filestack_file_url onto cached_attributes' do
      # filestack_file is required so it will be saved upon create(:image_item)
      expect(item.cached_filestack_file_url).to eq(item.filestack_file_url)
    end
  end

  describe '#cache_cover' do
    let(:collection) { create(:collection, num_cards: 3) }
    let!(:image_card) { create(:collection_card_image, parent: collection) }

    it 'caches cover onto cached_attributes' do
      expect(collection.cached_cover).to be nil
      collection.cache_cover
      expect(collection.cached_cover['text']).not_to be nil
      expect(collection.cached_cover['image_url']).not_to be nil
    end
  end
end
