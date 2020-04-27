require 'rails_helper'

RSpec.describe CollectionViewingChannel, type: :channel do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, add_viewers: [user]) }
  let(:stream_name) { collection.stream_name }

  before do
    stub_connection current_user: user, current_ability: Ability.new(user)
  end

  context 'without read access' do
    let(:collection) { create(:collection) }
    let!(:subscription) { subscribe(id: collection.id) }

    it 'rejects the subscription' do
      expect(subscription).to be_rejected
    end
  end

  describe '#edited' do
    let!(:subscription) { subscribe(id: collection.id) }

    it 'notifies the viewers of the collection' do
      expect { perform(:edited) }.to have_broadcasted_to(stream_name)
        .with(
          hash_including(
            current_editor: user.as_json,
            collaborators: anything,
            num_viewers: 1,
            record_id: collection.id.to_s,
            record_type: 'collections',
          ),
        )
    end

    context 'with an existing viewer' do
      let(:user_2) { create(:user) }

      before do
        collection.started_viewing(user_2)
      end

      it 'notifies all viewers' do
        expect { perform(:edited) }.to have_broadcasted_to(stream_name)
          .with(
            hash_including(
              current_editor: user.as_json,
              collaborators: anything,
              num_viewers: 2,
              record_id: collection.id.to_s,
              record_type: 'collections',
            ),
          )
      end
    end
  end
end
