require 'rails_helper'

RSpec.describe CollectionViewingChannel, type: :channel do
  let(:collection) { create(:collection) }
  let(:user) { create(:user) }
  let(:stream_name) { collection.stream_name }

  before do
    stub_connection current_user: user
  end

  describe '#subscribe' do
    it 'does not do anything?' do
    end
  end

  describe '#edited' do
    let!(:subscription) { subscribe(id: collection.id) }

    it 'notifies the viewers of the collection' do
      # TODO: do we need to notify the editors?
      expect { perform(:edited) }.to have_broadcasted_to(stream_name).with(
        collection_id: collection.id,
      )
    end

    context 'with an existing viewer' do
      let(:user_2) { create(:user) }

      before do
        collection.started_viewing(user_2)
      end

      it 'notifies all viewers' do
        expect { perform(:edited) }.to have_broadcasted_to(stream_name).with(
          collection_id: collection.id,
        )
      end
    end
  end

  describe '#unsubscribed' do
    let!(:subscription) { subscribe(id: collection.id) }

    it 'notifies viewer left' do
      expect { subscription.unsubscribed }.to have_broadcasted_to(stream_name).with(
        collection_id: collection.id,
      )
    end
  end
end
