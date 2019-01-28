require 'rails_helper'

RSpec.describe CollectionCover, type: :service do
  describe '#generate' do
    let(:collection_cover) { CollectionCover.call(collection) }

    context 'with normal settings, text and image' do
      let!(:collection) { create(:collection) }
      # pdf is in here to ensure that it is not selected as the media item
      let!(:pdf_item) { create(:collection_card_pdf, parent: collection, order: 0) }
      let!(:text_item) { create(:collection_card_text, parent: collection, order: 1) }
      let!(:image_item) { create(:collection_card_image, parent: collection, order: 2) }
      let!(:video_item) { create(:collection_card_video, parent: collection, order: 3) }

      it 'gets the first image item' do
        expect(collection_cover['image_url']).to eq image_item.item.filestack_file_url
      end

      it 'gets the first text item' do
        expect(collection_cover['text']).to eq text_item.item.plain_content
      end

      it 'should broadcast the collection update' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(collection)
        collection_cover
      end

      context 'after archiving the cover item' do
        before do
          # for this test we want to check how the cached_cover gets set/updated
          collection.cache_cover!
        end

        it 'should automatically set the cover to the next media item' do
          expect(collection.cached_cover['image_url']).to eq image_item.item.filestack_file_url
          # should broadcast this update
          expect(CollectionUpdateBroadcaster).to receive(:call).with(collection)
          image_item.archive!
          expect(video_item.reload.is_cover?).to be true
          expect(collection.cached_cover['image_url']).to eq video_item.item.image_url
        end
      end
    end

    context 'with an image manually set' do
      let!(:collection) { create(:collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:image_item) { create(:collection_card_image, parent: collection) }
      let!(:picked_image_item) do
        create(:collection_card_image, parent: collection,
                                       is_cover: true)
      end

      it 'skips the first image item and gets the manually selected image' do
        expect(collection_cover['image_url']).to_not be_nil
        expect(collection_cover['image_url']).to eq image_item.item.filestack_file_url
      end
    end

    context 'with linked items' do
      let!(:collection) { create(:collection) }
      let!(:link_image) { create(:collection_card_link_image, parent: collection, order: 0) }
      let!(:image) { create(:collection_card_image, parent: collection, order: 1) }
      # to ensure we aren't finding the primary card from the linked collection and setting it as the cover
      let!(:primary_card_of_link) { create(:collection_card_image, item: link_image.item) }

      before do
        link_image.item.filestack_file.update(url: 'https://linked/image.jpg')
      end

      it 'sets the linked image card as the cover' do
        expect(collection_cover['image_url']).to eq link_image.item.filestack_file_url
        expect(collection_cover['card_ids']).to include(link_image.id)
      end
    end

    context 'with no_cover setting' do
      let!(:collection) { create(:collection, cached_cover: { 'no_cover': true }) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:image_item) { create(:collection_card_image, parent: collection) }

      it 'does not select any image item' do
        expect(collection_cover['image_url']).to be_nil
        expect(collection_cover['no_cover']).to be true
      end
    end

    context 'with no image' do
      let!(:collection) { create(:collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }

      it 'does not find an image' do
        expect(collection_cover['image_url']).to be nil
      end

      it 'gets the first text item' do
        expect(collection_cover['text']).to eq text_item.item.plain_content
      end
    end

    context 'with a video but no image' do
      let!(:collection) { create(:collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:video_item) { create(:collection_card_video, parent: collection) }

      it 'uses image from video item' do
        expect(collection_cover['image_url']).to eq video_item.item.thumbnail_url
      end
    end

    context 'with private sub-items' do
      let(:users) { create_list(:user, 3) }
      let(:editor) { users[0] }
      let(:viewer) { users[1] }
      let!(:collection) { create(:collection, add_editors: [editor], add_viewers: [viewer]) }
      let!(:private_text_item) { create(:collection_card_text, parent: collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:private_image_item) { create(:collection_card_image, parent: collection) }
      let!(:video_item) { create(:collection_card_video, parent: collection) }
      let(:shared_data) { [collection, text_item.item, video_item.item] }
      let(:private_data) { [private_text_item.item, private_image_item.item] }

      before do
        private_data.each do |obj|
          obj.unanchor_and_inherit_roles_from_anchor!
          # private data does not include the viewer
          editor.add_role(Role::EDITOR, obj)
          # the `private_child?` caching only checks for updated_at to the second, have to fudge that
          obj.roles.first.update(updated_at: 10.seconds.from_now)
        end
      end

      it 'uses text from the shared text item' do
        expect(collection_cover['text']).to eq text_item.item.plain_content
      end

      it 'uses image from the shared video item' do
        expect(collection_cover['image_url']).to eq video_item.item.thumbnail_url
      end
    end
  end
end
