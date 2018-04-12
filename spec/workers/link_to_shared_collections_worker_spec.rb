require 'rails_helper'

RSpec.describe LinkToSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:users_to_add) { create_list(:user, 1) }
    let!(:collection_to_link) { create(:collection) }
    let(:shared_with_me) { create(:shared_with_me_collection, num_cards: 0) }
    let(:my_collection) { create(:user_collection, num_cards: 1) }

    before do
      allow_any_instance_of(User)
        .to receive(:current_shared_collection).and_return(shared_with_me)
      allow_any_instance_of(User)
        .to receive(:current_user_collection).and_return(my_collection)
    end

    it 'should create a link to shared/my collections' do
      LinkToSharedCollectionsWorker.new.perform(
        users_to_add.map(&:id),
        collection_to_link.id,
        collection_to_link.class.name,
      )

      # each one should have been added 1 link card
      expect(shared_with_me.link_collection_cards.count).to eq 1
      expect(my_collection.link_collection_cards.count).to eq 1
      # my_collection now has 2 cards total
      expect(my_collection.collection_cards.count).to eq 2
    end

    context 'when a link to the object already exists' do
      let(:my_collection) { create(:user_collection, num_cards: 0) }
      let!(:existing_link) do
        create(:collection_card_link, parent: my_collection, collection: collection_to_link)
      end

      before do
        LinkToSharedCollectionsWorker.new.perform(
          users_to_add.map(&:id),
          collection_to_link.id,
          collection_to_link.class.name,
        )
      end

      it 'should not create a doubled link in my collection' do
        expect(my_collection.collection_cards.count).to eq(1)
      end
    end

    context 'with multiple users' do
      let(:users_to_add) { create_list(:user, 4) }

      it 'should create two links for every user' do
        expect(CollectionCard::Link).to receive(:create).at_least(8).times
        LinkToSharedCollectionsWorker.new.perform(
          users_to_add.map(&:id),
          collection_to_link.id,
          collection_to_link.class.name,
        )
      end
    end

    context 'when object was created by the user being linked to' do
      let!(:user) { create(:user) }
      let!(:users_to_add) { [user] }
      let!(:collection_created_by) { create(:collection, created_by: user) }
      let(:shared_with_me) { create(:shared_with_me_collection, num_cards: 0) }
      let(:my_collection) { create(:user_collection, num_cards: 0) }

      before do
        LinkToSharedCollectionsWorker.new.perform(
          users_to_add.map(&:id),
          collection_created_by.id,
          collection_created_by.class.name,
        )
      end

      it 'should not create any links for that user' do
        expect(my_collection.collection_cards.count).to eq(0)
        expect(shared_with_me.collection_cards.count).to eq(0)
      end
    end
  end
end
