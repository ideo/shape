require 'rails_helper'

RSpec.describe UnlinkFromSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:users) { create_list(:user, 3) }
    let(:collection) { create(:collection) }
    let(:shared_with_me) { create(:collection, num_cards: 1) }
    let(:my_collection) { create(:collection, num_cards: 1) }
    let(:fake_link_shared) { create(:collection_card) }
    let(:fake_link_my) { create(:collection_card) }

    before do
      allow_any_instance_of(User)
        .to receive(:current_shared_collection).and_return(shared_with_me)
      allow_any_instance_of(User)
        .to receive(:current_user_collection).and_return(my_collection)
      fake_link_shared.parent = shared_with_me
      fake_link_shared.collection_id = collection.id
      fake_link_my.parent = my_collection
      fake_link_my.collection_id = collection.id
      shared_with_me.collection_cards.push(fake_link_shared)
      my_collection.collection_cards.push(fake_link_my)
    end

    it 'should remove links of collection in shared' do
      UnlinkFromSharedCollectionsWorker.new.perform(
        users.map(&:id),
        collection.id,
        collection.class.name.to_s,
      )

      expect(shared_with_me.collection_cards.count).to eq(1)
      expect(my_collection.collection_cards.count).to eq(1)
    end
  end
end
