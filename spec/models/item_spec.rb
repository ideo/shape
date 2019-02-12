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

  context 'callbacks' do
    describe '#cache_previous_thumbnail_url' do
      let(:item) { create(:video_item) }

      it 'should save the previous thumbnail_url in the cached array' do
        prev_url = item.thumbnail_url
        expect {
          item.update(thumbnail_url: 'http://new.image.com/x.jpg')
        }.to change(item, :previous_thumbnail_urls)
        expect(item.reload.previous_thumbnail_urls).to match_array([prev_url])
      end

      it 'should save up to 9 thumbnail_urls' do
        (1..10).each do |i|
          item.update(thumbnail_url: "http://new.image.com/x#{i}.jpg")
        end
        expect(item.reload.previous_thumbnail_urls.count).to eq 9
      end
    end
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

    context 'without user' do
      let(:duplicate_without_user) do
        item.duplicate!(
          copy_parent_card: copy_parent_card,
        )
      end

      it 'clones the item' do
        expect { duplicate_without_user }.to change(Item, :count).by(1)
        expect(duplicate_without_user).not_to eq(item)
      end

      it 'references the current item as cloned_from' do
        expect(duplicate_without_user.cloned_from).to eq(item)
      end
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

  describe '#search_data' do
    let!(:collection) { create(:collection) }
    let!(:parent_collection_card) { create(:collection_card, parent: collection) }

    it 'includes tags' do
      item = create(:text_item, parent_collection_card: parent_collection_card)
      item.tag_list.add('foo')
      item.tag_list.add('bar')
      item.save
      item.reload
      expect(item.search_data[:tags]).to include('foo')
      expect(item.search_data[:tags]).to include('bar')
    end

    it 'includes the name' do
      item = create(:text_item, name: 'derp', parent_collection_card: parent_collection_card)
      expect(item.search_data[:name]).to eql('derp')
    end

    it 'includes user_ids from the parent' do
      item = create(:text_item, parent_collection_card: parent_collection_card)
      expect(item.search_data[:user_ids]).to eql(collection.search_user_ids)
    end

    it 'includes group_ids from the parent' do
      item = create(:text_item, parent_collection_card: parent_collection_card)
      expect(item.search_data[:group_ids]).to eql(collection.search_group_ids)
    end

    it 'includes organization_id from the parent' do
      item = create(:text_item, parent_collection_card: parent_collection_card)
      expect(item.search_data[:organization_id]).to eql(collection.organization_id)
    end

    context 'TextItem' do
      it 'includes the content of the text item in the search content' do
        item = create(:text_item, parent_collection_card: parent_collection_card)
        expect(item.search_data[:content]).to include(item.plain_content)
      end
    end

    context 'FileItem' do
      it 'includes the filename in the search content' do
        item = create(:file_item, parent_collection_card: parent_collection_card)
        expect(item.search_data[:content]).to include(item.filestack_file.filename)
      end
    end

    context 'other types' do
      let(:orphaned_item) { create(:text_item) }

      it 'does not blow up on orphaned items' do
        expect(orphaned_item.search_data[:organization_id]).to be nil
      end

      it 'includes the item content in the search content' do
        link_item = create(:link_item, parent_collection_card: parent_collection_card)
        expect(link_item.search_data[:content]).to include(link_item.content)
      end

      it 'does not include nil content' do
        video_item = create(:video_item, parent_collection_card: parent_collection_card)
        expect(video_item.search_data[:content]).to eq('')

        question_item = create(:question_item, parent_collection_card: parent_collection_card)
        expect(question_item.search_data[:content]).to eq('')

        chart_item = create(:chart_item, :with_question_item, parent_collection_card: parent_collection_card)
        expect(chart_item.search_data[:content]).to eq('')
      end
    end
  end
end
