require 'rails_helper'

RSpec.describe LinkToSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user, add_to_org: organization) }
    let!(:users_to_add) { [user] }
    let(:groups_to_add) { create_list(:group, 1) }
    let!(:collection_to_link) { create(:collection, organization: organization) }
    let(:item_to_link) { nil }
    let(:existing_link) { nil }

    before do
      allow(CollectionCard::Link).to receive(:create).and_call_original
      # TODO: why is this needed?
      if existing_link
        user.current_shared_collection.link_collection_cards.push(existing_link)
      end
      LinkToSharedCollectionsWorker.new.perform(
        users_to_add.map(&:id),
        groups_to_add.map(&:id),
        [collection_to_link&.id].compact,
        [item_to_link&.id].compact,
      )
    end

    it 'should create a link to shared/my collections' do
      # each one should have been added 1 link card
      expect(user.current_shared_collection.link_collection_cards.count).to eq 1
      expect(user.current_user_collection.link_collection_cards.count).to eq 1
      # current_user_collection now has 2 cards total
      expect(user.current_user_collection.collection_cards.count).to eq 2
    end

    it 'should create links to groups shared collections' do
      expect(
        groups_to_add.first.current_shared_collection.collection_cards.count,
      ).to eq(1)
    end

    context 'when a link to the object already exists' do
      let(:groups_to_add) { [] }
      let!(:existing_link) do
        create(:collection_card_link_collection,
               parent: user.current_shared_collection,
               collection: collection_to_link)
      end

      it 'should not create a duplicate link in my collection' do
        expect(user.current_shared_collection.link_collection_cards.count).to eq(1)
      end
    end

    context 'when the link is of an application collection' do
      let!(:collection_to_link) { create(:application_collection, organization: organization) }

      it 'should add the link at the first position' do
        link = user.current_shared_collection.collection_cards.first
        expect(link.collection_id).to eq collection_to_link.id
      end
    end

    context 'when the link is a child of an application collection' do
      let!(:application_collection) { create(:application_collection, organization: organization) }
      let!(:collection_to_link) { create(:collection, parent_collection: application_collection, organization: organization) }

      it 'should add the link at the first position' do
        link = user.current_shared_collection.collection_cards.first
        expect(link.collection_id).to eq application_collection.collections.first.id
      end
    end

    context 'when the link is a child of a child of an application collection' do
      let!(:application_collection) { create(:application_collection, organization: organization) }
      let(:child_collection) do
        create(:collection,
               parent_collection: application_collection,
               organization: organization)
      end
      let!(:collection_to_link) do
        create(:collection,
               parent_collection: child_collection,
               organization: organization)
      end

      it 'should add the link at the first position' do
        link = user.current_shared_collection.collection_cards.first
        expect(link.collection_id).to eq application_collection.collections.first.id
      end
    end

    context 'when the link is an item' do
      let!(:collection_to_link) { nil }
      let!(:parent_collection) { create(:collection, organization: organization) }
      let!(:item_to_link) { create(:text_item, parent_collection: parent_collection) }

      it 'calls CollectionCard::Link with item id' do
        expect(CollectionCard::Link).to have_received(:create).with(
          parent: anything,
          item_id: item_to_link.id,
          collection_id: nil,
          width: 1,
          height: 1,
          order: instance_of(Integer),
        ).exactly(3).times
      end
    end

    context 'with multiple users' do
      let(:users_to_add) { create_list(:user, 4, add_to_org: organization) }

      it 'should create two links for every user' do
        # NOTE: thoughts on looping in tests, I usually don't do it
        users_to_add.each do |user|
          expect(user.current_shared_collection.link_collection_cards.count).to eq(1)
          expect(user.current_user_collection.link_collection_cards.count).to eq(1)
        end
      end
    end

    context 'when object was created by the user being linked to' do
      let!(:collection_created_by) { create(:collection, created_by: user) }
      let!(:collection_to_link) { collection_created_by }

      it 'should not create any links for that user' do
        expect(user.current_user_collection.link_collection_cards.count).to eq(0)
        expect(user.current_shared_collection.link_collection_cards.count).to eq(0)
      end
    end

    context 'with a bot user' do
      let(:application) { create(:application, add_orgs: [organization]) }
      let(:user) { application.user }

      it 'should not create any links for that user' do
        expect(user.current_user_collection.link_collection_cards.count).to eq(0)
        expect(user.current_shared_collection).to be nil
      end
    end
  end
end
