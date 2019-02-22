require 'rails_helper'

RSpec.describe LinkToSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user, add_to_org: organization) }
    let!(:users_to_add) { [user] }
    let(:groups_to_add) { create_list(:group, 1) }
    let!(:collection_to_link) { create(:collection, organization: organization) }
    let(:existing_link) { nil }

    before do
      # TODO: why is this needed?
      if existing_link
        user.current_shared_collection.link_collection_cards.push(existing_link)
      end
      LinkToSharedCollectionsWorker.new.perform(
        users_to_add.map(&:id),
        groups_to_add.map(&:id),
        [collection_to_link.id],
        [],
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
