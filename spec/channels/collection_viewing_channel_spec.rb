require 'rails_helper'

RSpec.describe CollectionViewingChannel, type: :channel do
  let(:collection) { create(:collection) }
  let(:user) { create(:user) }
  let(:stream_name) { collection.stream_name }

  before do
    stub_connection current_user: user
  end

  describe '#edited' do
    let!(:subscription) { subscribe(id: collection.id) }

    it 'notifies the viewers of the collection' do
      expect { perform(:edited) }.to have_broadcasted_to(stream_name).with(
        current_editor: {},
        num_viewers: 1,
        record_id: collection.id,
        record_type: 'collections',
      )
    end

    context 'with an existing viewer' do
      let(:user_2) { create(:user) }

      before do
        collection.started_viewing(user_2)
      end

      it 'notifies all viewers' do
        expect { perform(:edited) }.to have_broadcasted_to(stream_name).with(
          current_editor: {},
          num_viewers: 2,
          record_id: collection.id,
          record_type: 'collections',
        )
      end
    end
  end
end
