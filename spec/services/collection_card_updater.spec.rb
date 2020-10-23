require 'rails_helper'

RSpec.describe CollectionCardUpdater, type: :service do
  describe '#call' do
    let!(:collection_card) { create(:collection_card) }
    let(:attributes) { {} }
    let(:service) do
      CollectionCardUpdater.new(collection_card, attributes)
    end

    context 'with valid attributes' do
      let(:attributes) do
        { id: collection_card.id, row: 3, width: 3 }
      end

      it 'assigns and saves attributes onto the collection card' do
        service.call
        expect(collection_card.row).to eq(attributes[:row])
        expect(collection_card.width).to eq(attributes[:width])
      end
    end

    context 'with cover_id attribute' do
      let(:image) { create(:filestack_file) }
      let(:file) { create(:file_item, filestack_file: image) }
      let(:cover_card) { create(:collection_card, item: file) }
      let(:attributes) do
        { cover_card_id: cover_card.id }
      end

      it 'assigns and saves cached_cover attributes onto the collection card' do
        service.call
        collection_card.reload
        expect(collection_card.cached_cover['image_url']).to eq(image.url)
        expect(collection_card.cached_cover['image_handle']).to eq(image.handle)
      end
    end

    context 'with hardcoded_title, hardcoded_subtitle, and subtitle_hidden attributes' do
      let(:hardcoded_title) { 'Title' }
      let(:hardcoded_subtitle) { 'Subtitle' }
      let(:subtitle_hidden) { false }
      let(:attributes) do
        { hardcoded_title: hardcoded_title,
          hardcoded_subtitle: hardcoded_subtitle,
          subtitle_hidden: subtitle_hidden }
      end

      it 'assigns and saves cached_cover attributes onto the collection card' do
        service.call
        collection_card.reload
        expect(collection_card.cached_cover['hardcoded_title']).to eq(hardcoded_title)
        expect(collection_card.cached_cover['hardcoded_subtitle']).to eq(hardcoded_subtitle)
        expect(collection_card.cached_cover['subtitle_hidden']).to eq(subtitle_hidden)
      end
    end
  end
end
