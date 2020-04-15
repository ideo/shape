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

  describe '#subscribed' do
    let(:subscription) { subscribe(id: collection.id) }

    it 'changes the num_viewers count' do
      expect {
        subscription
      }.to change(collection, :num_viewers).by(1)
    end

    context 'with an existing viewer' do
      let(:user_2) { create(:user) }

      before do
        subscription
      end

      it 'changes the num_viewers count' do
        expect {
          collection.started_viewing(user_2)
        }.to change(collection, :num_viewers).by(1)
        expect {
          collection.stopped_viewing(user)
          collection.stopped_viewing(user_2)
        }.to change(collection, :num_viewers).by(-2)
      end
    end
  end
end
