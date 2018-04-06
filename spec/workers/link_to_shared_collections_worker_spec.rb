require 'rails_helper'

RSpec.describe AddRolesToChildrenWorker, type: :worker do
  describe '#perform' do
    let(:users_to_add) { create_list(:user, 3) }
    let(:collection_to_link) { create(:collection) }
    let(:shared_with_me) { create(:collection, num_cards: 0) }
    let(:my_collection) { create(:collection, num_cards: 1) }
    let(:fake_link_shared) { create(:collection_card) }
    let(:fake_link_my) { create(:collection_card) }

    before do
      allow_any_instance_of(User)
        .to receive(:current_shared_collection).and_return(shared_with_me)
      allow_any_instance_of(User)
        .to receive(:current_user_collection).and_return(my_collection)
      allow(CollectionCard::Link).to receive(:new).and_return(
        fake_link_shared, fake_link_my)
    end

    it 'should create a link to shared collection' do
      expect(fake_link_shared).to receive(:save).at_least(:once)
      expect(fake_link_my).to receive(:save).at_least(:once)
      LinkToSharedCollectionsWorker.new.perform(
        users_to_add.map(&:id),
        collection_to_link,
      )

      expect(fake_link_shared.parent).to be shared_with_me
      expect(fake_link_my.parent).to be my_collection
      expect(fake_link_shared.collection_id).to equal(collection_to_link.id)
      expect(fake_link_my.collection_id).to equal(collection_to_link.id)
    end
  end
end
