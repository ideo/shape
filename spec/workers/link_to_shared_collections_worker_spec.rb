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
    let(:perform) do
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
      perform
      # each one should have been added 1 link card
      expect(user.current_shared_collection.link_collection_cards.count).to eq 1
      expect(user.current_user_collection.link_collection_cards.count).to eq 1
      # current_user_collection now has 2 cards total
      expect(user.current_user_collection.collection_cards.count).to eq 2
    end

    it 'should create links to groups shared collections' do
      perform
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
        perform
        expect(user.current_shared_collection.link_collection_cards.count).to eq(1)
      end
    end

    context 'when the link is a child of an application collection' do
      let!(:application_collection) do
        create(:application_collection, organization: organization)
      end
      let!(:collection_to_link) do
        create(
          :collection,
          name: '{{CD.DASHBOARD.CREATIVE-DIFFERENCE}}',
          parent_collection: application_collection,
          organization: organization,
        )
      end

      it 'adds the link at the -10 position with 3x2 size' do
        perform
        link = user.current_shared_collection.collection_cards.first
        # link to the org collection within the root application collection
        expect(link.collection_id).to eq(collection_to_link.id)
        expect(link.width).to eq(3)
        expect(link.height).to eq(2)
        expect(link.order).to eq(-10)
      end

      context 'with second record matching method library' do
        let!(:method_library_collection) do
          create(
            :collection,
            name: '{{CD.DASHBOARD.METHOD_LIBRARY}}',
            parent_collection: application_collection,
            organization: organization,
          )
        end
        before do
          perform
          LinkToSharedCollectionsWorker.new.perform(
            users_to_add.map(&:id),
            groups_to_add.map(&:id),
            [method_library_collection.id],
            [],
          )
        end

        it 'adds a link at -9 position with 1x2 size' do
          first, second = user.current_shared_collection.collection_cards.reorder(order: :asc).first(2)
          expect(first.collection_id).to eq(collection_to_link.id)
          expect(second.collection_id).to eq(method_library_collection.id)
          expect(second.width).to eq(1)
          expect(second.height).to eq(2)
          expect(second.order).to eq(-9)
        end
      end
    end

    context 'when the link is a child of a child of an application collection' do
      let!(:application_collection) { create(:application_collection, organization: organization) }
      let(:child_collection) do
        create(:collection,
               name: '{{CD.DASHBOARD.CREATIVE-DIFFERENCE}}',
               parent_collection: application_collection,
               organization: organization)
      end
      let!(:collection_to_link) do
        create(:collection,
               name: 'Business Unit Dashboard',
               parent_collection: child_collection,
               organization: organization)
      end

      it 'adds the link at the -10 position with 3x2 size' do
        perform
        link = user.current_shared_collection.collection_cards.first
        # link to the org collection within the root application collection
        expect(link.collection_id).to eq(child_collection.id)
        expect(link.width).to eq(3)
        expect(link.height).to eq(2)
        expect(link.order).to eq(-10)
      end

      context 'when both objects are shared' do
        before do
          LinkToSharedCollectionsWorker.new.perform(
            users_to_add.map(&:id),
            groups_to_add.map(&:id),
            [collection_to_link.id, child_collection.id],
            [],
          )
        end

        it 'does not create duplicate link' do
          expect(
            user.current_shared_collection
                .collection_cards
                .link
                .where(collection_id: child_collection.id)
                .count,
          ).to eq(1)
        end
      end
    end

    context 'when the link is an item' do
      let!(:collection_to_link) { nil }
      let!(:parent_collection) { create(:collection, organization: organization) }
      let!(:item_to_link) { create(:text_item, parent_collection: parent_collection) }

      it 'calls CollectionCard::Link with item id' do
        perform
        expect(CollectionCard::Link).to have_received(:create).with(
          hash_including(
            parent: anything,
            item_id: item_to_link.id,
            collection_id: nil,
            width: 1,
            height: 1,
            order: instance_of(Integer),
          ),
        ).exactly(3).times
      end
    end

    context 'with multiple users' do
      let(:users_to_add) { create_list(:user, 4, add_to_org: organization) }

      it 'should create two links for every user' do
        perform
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
        perform
        expect(user.current_user_collection.link_collection_cards.count).to eq(0)
        expect(user.current_shared_collection.link_collection_cards.count).to eq(0)
      end
    end

    context 'with a bot user' do
      let(:application) { create(:application, add_orgs: [organization]) }
      let(:user) { application.user }

      it 'should not create any links for that user' do
        perform
        expect(user.current_user_collection.link_collection_cards.count).to eq(0)
        expect(user.current_shared_collection).to be nil
      end
    end

    context 'if collection to link has custom card attributes' do
      let(:card_style_attrs) do
        {
          image_contain: true,
          font_background: true,
          font_color: '#CC0000',
          filter: 'nothing',
          show_replace: false,
        }
      end
      let!(:collection_to_link) do
        create(:collection,
               parent_collection: create(:collection, organization: organization),
               organization: organization)
      end
      before do
        collection_to_link.parent_collection_card.update(
          card_style_attrs,
        )
      end

      it 'copies the styles to the link card' do
        perform
        link = user.current_shared_collection.collection_cards.first
        link_style_attrs = link.attributes.symbolize_keys.slice(*card_style_attrs.keys)
        expect(link_style_attrs).to eq(card_style_attrs)
      end
    end
  end
end
