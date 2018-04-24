require 'rails_helper'

RSpec.describe CollectionCover, type: :service do
  describe '#generate' do
    let(:collection_cover) { CollectionCover.call(collection) }

    context 'with normal settings, text and image' do
      let!(:collection) { create(:collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:image_item) { create(:collection_card_image, parent: collection) }
      let!(:video_item) { create(:collection_card_video, parent: collection) }

      it 'gets the first image item' do
        expect(collection_cover['image_url']).to eq image_item.item.filestack_file_url
      end

      it 'gets the first text item' do
        expect(collection_cover['text']).to eq text_item.item.plain_content
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
      let!(:collection) { create(:collection) }
      let!(:private_text_item) { create(:collection_card_text, parent: collection) }
      let!(:text_item) { create(:collection_card_text, parent: collection) }
      let!(:private_image_item) { create(:collection_card_image, parent: collection) }
      let!(:video_item) { create(:collection_card_video, parent: collection) }
      let(:shared_data) { [collection, text_item.item, video_item.item] }
      let(:private_data) { [private_text_item.item, private_image_item.item] }
      let(:editor) { users[0] }
      let(:viewer) { users[1] }

      before do
        shared_data.each do |obj|
          editor.add_role(Role::EDITOR, obj)
          viewer.add_role(Role::VIEWER, obj)
        end
        private_data.each do |obj|
          editor.add_role(Role::EDITOR, obj)
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
