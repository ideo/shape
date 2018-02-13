require 'rails_helper'

RSpec.describe CollectionBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, organization: organization) }
  let(:collection_card) { create(:collection_card, parent: collection) }
  let(:params) {
    {
      'name': 'My Fancy Collection'
    }
  }

  describe '#save' do
    let(:builder) {
      CollectionBuilder.new(params: params,
                            organization: organization,
                            parent_card: collection_card)
    }

    context 'for root collection' do
      let(:builder) {
        CollectionBuilder.new(params: params, organization: organization)
      }

      it 'should be true' do
        expect(builder.save).to be true
      end

    end

    context 'for sub-collection' do
      let(:builder) {
        CollectionBuilder.new(params: params, parent_card: collection_card)
      }

      it 'should be true' do
        expect(builder.save).to be true
      end
    end
  end

  describe '#collection' do
    context 'for root collection' do
      let(:builder) {
        CollectionBuilder.new(params: params, organization: organization)
      }

      before do
        expect(builder.save).to be true
      end

      it 'should have persisted collection' do
        expect(builder.collection.persisted?).to be true
      end

      it 'should have org assigned' do
        expect(builder.collection.organization).to eq(organization)
      end
    end

    context 'for sub-collection' do
      let(:builder) {
        CollectionBuilder.new(params: params, parent_card: collection_card)
      }

      before do
        expect(builder.save).to be true
      end

      it 'should have persisted collection' do
        expect(builder.collection.persisted?).to be true
      end

      it 'should have parent assigned' do
        expect(builder.collection.parent).to eq(collection)
      end
    end
  end
end
