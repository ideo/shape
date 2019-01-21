require 'rails_helper'

RSpec.describe CollectionUpdater, type: :service do
  describe '#call' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let(:first_card) { collection.collection_cards.first }
    let(:attributes) { {} }

    context 'with valid attributes' do
      let(:attributes) do
        { name: 'My new name', collection_cards_attributes: { id: first_card.id, order: 3, width: 3 } }
      end

      it 'assigns and saves attributes onto the collection' do
        CollectionUpdater.call(collection, attributes)
        expect(collection.name).to eq attributes[:name]
      end

      it 'assigns and saves attributes onto the collection cards' do
        CollectionUpdater.call(collection, attributes)
        first_card.reload
        expect(first_card.order).to eq 3
        expect(first_card.width).to eq 3
      end

      it 'always sets collection.updated_at' do
        expect {
          CollectionUpdater.call(collection, attributes)
        }.to change(collection, :updated_at)
      end

      it 'caches the collection cover if the updated cards are relevant' do
        collection.cache_cover!
        # changing the card's order will affect the cover
        expect {
          CollectionUpdater.call(collection, attributes)
        }.to change(collection, :cached_cover)
      end

      it 'does not cache the collection cover if not needed' do
        # call it once, attrs are saved and cover is cached
        CollectionUpdater.call(collection, attributes)
        # second time with same attrs shouldn't change anything
        expect {
          CollectionUpdater.call(collection, attributes)
        }.not_to change(collection, :cached_cover)
      end
    end

    context 'with a master template' do
      let(:attributes) do
        { name: 'My new name', collection_to_test_id: 999, collection_cards_attributes: { id: first_card.id } }
      end

      before do
        collection.update(master_template: true)
      end

      it 'calls queue_update_template_instances if collection_cards_attributes present' do
        expect(collection).to receive(:queue_update_template_instances)
        CollectionUpdater.call(collection, attributes)
      end

      it 'calls update_test_template_instance_types if collection_to_test setting has changed' do
        expect(collection).to receive(:update_test_template_instance_types!)
        CollectionUpdater.call(collection, attributes)
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
        CollectionUpdater.call(collection, attributes)
        submission.reload
        expect(submission.submission_attrs['hidden']).to be false
      end
    end

    context 'with invalid attributes' do
      let(:attributes) { { name: nil } }
      let(:result) { CollectionUpdater.call(collection, attributes) }

      it 'returns false with errors on collection' do
        expect(result).to be false
        expect(collection.errors).not_to be_empty
      end
    end
  end
end
