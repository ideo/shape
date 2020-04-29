require 'rails_helper'

RSpec.describe CollectionUpdater, type: :service do
  describe '#call' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let(:cards) { collection.collection_cards }
    let(:first_card) { cards.first }
    let(:last_card) { cards.last }
    let(:attributes) { {} }
    let(:unarchiving) { false }
    let(:service) do
      CollectionUpdater.new(
        collection,
        attributes,
        unarchiving: unarchiving,
      )
    end

    context 'with valid attributes' do
      let(:attributes) do
        { name: 'My new name', collection_cards_attributes: [{ id: first_card.id, order: 3, width: 3 }] }
      end

      it 'assigns and saves attributes onto the collection' do
        service.call
        expect(collection.name).to eq attributes[:name]
      end

      it 'assigns and saves attributes onto the collection cards' do
        service.call
        first_card.reload
        expect(first_card.order).to eq 3
        expect(first_card.width).to eq 3
      end

      it 'always sets collection.updated_at' do
        expect {
          service.call
        }.to change(collection, :updated_at)
      end

      it 'caches the collection cover if the updated cards are relevant' do
        collection.cache_cover!
        # changing the card's order will affect the cover
        expect {
          service.call
        }.to change(collection, :cached_cover)
      end

      it 'does not cache the collection cover if not needed' do
        # call it once, attrs are saved and cover is cached
        service.call
        # second time with same attrs shouldn't change anything
        expect {
          service.call
        }.not_to change(collection, :cached_cover)
      end

      it 'does not update hardcoded collection cover values unless cover attributes are present' do
        collection.update(
          cached_cover: {
            subtitle_hidden: true,
            hardcoded_subtitle: 'Lorem ipsum.',
          },
        )
        service.call
        collection.reload
        expect(collection.cached_cover['subtitle_hidden']).to be true
        expect(collection.cached_cover['hardcoded_subtitle']).to eq 'Lorem ipsum.'
      end
    end

    context 'with valid board placement' do
      let!(:collection) { create(:board_collection, num_cards: 2) }
      let(:attributes) do
        {
          collection_cards_attributes: [
            { id: last_card.id.to_s, row: 10, col: 1 },
          ],
        }
      end

      before do
        first_card.update(row: 0, col: 0, width: 4, height: 1)
        last_card.update(row: 2, col: 2)
      end

      it 'moves the cards' do
        service.call
        expect(last_card.reload.row).to eq 10
      end
    end

    context 'with subtitle values' do
      let(:attributes) do
        { hardcoded_subtitle: 'my cool description', subtitle_hidden: false }
      end

      it 'saves subtitle' do
        expect(collection.cached_cover).to be nil
        service.call
        expect(collection.cached_cover['hardcoded_subtitle']).to eq attributes[:hardcoded_subtitle]
        expect(collection.cached_cover['subtitle_hidden']).to be false
      end
    end

    context 'with invalid attributes' do
      context 'with invalid name' do
        let(:attributes) { { name: nil } }

        it 'returns false with errors on collection' do
          expect(service.call).to be false
          expect(collection.errors).not_to be_empty
        end
      end

      context 'with invalid card id' do
        let(:attributes) do
          {
            name: 'My new name',
            collection_cards_attributes: [
              # send id as string to mimic front-end
              { id: first_card.id.to_s, order: 3, width: 3 },
              { id: '991919', order: 1, width: 1 },
            ],
          }
        end

        it 'ignores missing card and assigns and saves attributes onto the collection' do
          service.call
          expect(collection.name).to eq attributes[:name]
          first_card.reload
          expect(first_card.order).to eq 3
          expect(first_card.width).to eq 3
        end
      end

      context 'with invalid board placement' do
        let!(:collection) { create(:board_collection, num_cards: 2) }
        let(:attributes) do
          {
            collection_cards_attributes: [
              { id: last_card.id.to_s, row: 0, col: 1 },
            ],
          }
        end

        before do
          first_card.update(row: 0, col: 0, width: 4, height: 1)
          last_card.update(row: 2, col: 2)
        end

        it 'does not allow' do
          service.call
          expect(last_card.reload.row).not_to eq 0
        end
      end
    end

    context 'with a master template' do
      let(:attributes) do
        { name: 'My new name', collection_to_test_id: 999, collection_cards_attributes: [{ id: first_card.id }] }
      end

      before do
        collection.update(master_template: true)
      end

      it 'calls queue_update_template_instances if collection_cards_attributes present' do
        expect(collection).to receive(:queue_update_template_instances).with(
          updated_card_ids: collection.collection_cards.pluck(:id),
          template_update_action: :update_card_attributes,
        )
        service.call
      end

      it 'calls update_test_template_instance_types if collection_to_test setting has changed' do
        expect(collection).to receive(:update_test_template_instance_types!)
        service.call
      end

      context 'when unarchiving' do
        let(:unarchiving) { true }

        it 'does not call queue_update_template_instances' do
          expect(collection).not_to receive(:queue_update_template_instances)
          service.call
        end
      end
    end

    context 'with a submission box' do
      let!(:collection) { create(:submission_box, hide_submissions: true) }
      let(:submissions_collection) { collection.submissions_collection }
      let(:submission) { create(:collection, :submission, parent_collection: submissions_collection) }
      let(:attributes) do
        { hide_submissions: false }
      end

      before do
        collection.setup_submissions_collection!
        submission.submission_attrs['hidden'] = true
        submission.save
      end

      it 'submits all submissions if you un-set the hide_submissions option' do
        expect(Roles::MergeToChild).to receive(:call).with(
          parent: collection,
          child: submission,
        )
        service.call
        submission.reload
        expect(submission.submission_attrs['hidden']).to be false
      end
    end
  end
end
