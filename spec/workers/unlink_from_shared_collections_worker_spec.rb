require 'rails_helper'

RSpec.describe UnlinkFromSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:users) { create_list(:user, 3) }
    let(:group) { create(:group) }
    let(:collection) { create(:collection) }
    let(:shared_with_me) { create(:collection, num_cards: 1) }
    let(:my_collection) { create(:collection, num_cards: 1) }
    let!(:fake_link_shared) do
      create(:collection_card_link_collection, parent: shared_with_me, collection: collection)
    end
    let!(:fake_link_my) do
      create(:collection_card_link_collection, parent: my_collection, collection: collection)
    end
    let!(:fake_link_group) do
      create(:collection_card_link_collection,
             parent: group.current_shared_collection,
             collection: collection)
    end

    before do
      allow_any_instance_of(User)
        .to receive(:current_shared_collection).and_return(shared_with_me)
      allow_any_instance_of(User)
        .to receive(:current_user_collection).and_return(my_collection)
    end

    it 'should remove links of collection in shared' do
      expect(shared_with_me.collection_cards.count).to eq(2)
      expect(my_collection.collection_cards.count).to eq(2)
      UnlinkFromSharedCollectionsWorker.new.perform(
        users.map(&:id),
        [group.id],
        collection.id,
        collection.class.name,
      )
      expect(shared_with_me.collection_cards.count).to eq(1)
      expect(my_collection.collection_cards.count).to eq(2)
    end

    it 'should remove group links' do
      expect(
        group.current_shared_collection.link_collection_cards.count
      ).to eq(1)
      UnlinkFromSharedCollectionsWorker.new.perform(
        users.map(&:id),
        [group.id],
        collection.id,
        collection.class.name,
      )
      expect(
        group.current_shared_collection.link_collection_cards.count
      ).to eq(0)
    end
  end
end
