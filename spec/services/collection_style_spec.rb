require 'rails_helper'

RSpec.describe CollectionStyle, type: :service do
  let(:collection) { create(:collection) }
  let(:style) do
    CollectionStyle.call(collection)
  end

  describe '#call' do
    context 'with no style attributes' do
      it 'returns nil' do
        expect(style).to eq(
          background_image_url: nil,
          font_color: nil,
        )
      end
    end

    context 'with style attributes present' do
      let(:collection) { create(:collection, background_image_url: 'xyz', font_color: '#123') }

      it 'returns the set attributes' do
        expect(style).to eq(
          background_image_url: 'xyz',
          font_color: '#123',
        )
      end

      context 'with a child collection' do
        let(:subcollection) { create(:collection, parent_collection: collection) }

        it 'returns nil unless propagate settings are present' do
          # .collection_style method calls the service
          expect(subcollection.collection_style).to eq(
            background_image_url: nil,
            font_color: nil,
          )
        end

        context 'with propagate settings' do
          before do
            collection.update(propagate_font_color: true, propagate_background_image: true)
          end

          it 'returns the parent style attributes' do
            expect(subcollection.collection_style).to eq(
              background_image_url: 'xyz',
              font_color: '#123',
            )
          end

          it 'returns its own settings if there are any' do
            subcollection.update(
              background_image_url: 'bbb',
              font_color: '#999',
            )
            expect(subcollection.collection_style).to eq(
              background_image_url: 'bbb',
              font_color: '#999',
            )
          end
        end
      end
    end
  end
end
