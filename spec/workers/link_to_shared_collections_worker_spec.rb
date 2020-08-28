require 'rails_helper'

RSpec.describe LinkToSharedCollectionsWorker, type: :worker do
  describe '#perform' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user, add_to_org: organization) }
    let!(:users_to_add) { [user] }
    let(:groups_to_add) { create_list(:group, 1) }
    let!(:collection_to_link) { create(:collection, organization: organization) }
    let(:item_to_link) { nil }
    let(:perform) do
      LinkToSharedCollectionsWorker.new.perform(
        users_to_add.map(&:id),
        groups_to_add.map(&:id),
        [collection_to_link&.id].compact,
        [item_to_link&.id].compact,
      )
    end

    before do
      allow(CollectionCardBuilder).to receive(:call).and_call_original
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
      expect(CollectionCardBuilder).to have_received(:call).with(
        params: hash_including(
          collection_id: collection_to_link.id,
          item_id: nil,
        ),
        parent_collection: anything,
        type: 'link',
        # 2 times for user (shared, mine) and 1 time for group (shared)
      ).exactly(3).times

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

      before do
        collection_to_link.parent_collection_card.update(
          width: 3,
          height: 2,
        )
      end

      it 'adds the link at 0,0 position with 3x2 size' do
        perform
        link = user.current_shared_collection.collection_cards.first
        # link to the org collection within the root application collection
        expect(link.collection_id).to eq(collection_to_link.id)
        expect(link.width).to eq(3)
        expect(link.height).to eq(2)
        expect(link.row).to eq(0)
        expect(link.col).to eq(0)
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
        let!(:preexisting_links) do
          create_list(:collection_card_link_text, 2, parent: user.current_user_collection)
        end
        let!(:other_collection) { create(:collection) }
        let(:dashboard_collection) { collection_to_link }
        let(:perform) do
          LinkToSharedCollectionsWorker.new.perform(
            users_to_add.map(&:id),
            groups_to_add.map(&:id),
            [
              other_collection.id,
              dashboard_collection.id,
              method_library_collection.id,
            ],
            [],
          )
        end
        let(:visible_cards) { user.current_user_collection.collection_cards.visible }

        before do
          # bump this over so that first cards are 0,0 and 0,1
          preexisting_links.second.update(col: 1)
          method_library_collection.parent_collection_card.update(
            width: 1,
            height: 2,
          )
        end

        it 'adds links in 0,0 and 0,3 position with proper size' do
          # these are the preexisting_links
          expect(visible_cards.pluck(:row, :col)).to eq([
            [0, 0],
            [0, 1],
          ])

          # now link the method library and dashboard
          perform

          expect(visible_cards.pluck(:collection_id, :item_id, :row, :col)).to eq([
            [dashboard_collection.id, nil, 0, 0],
            [method_library_collection.id, nil, 0, 3],
            [nil, preexisting_links.first.item_id, 2, 0],
            [nil, preexisting_links.second.item_id, 2, 1],
            [other_collection.id, nil, 2, 2],
          ])
        end
      end
    end

    context 'when the link is a child of a child of an application collection' do
      let!(:application_collection) { create(:application_collection, organization: organization) }
      let(:dashboard_collection) do
        create(:collection,
               name: '{{CD.DASHBOARD.CREATIVE-DIFFERENCE}}',
               parent_collection: application_collection,
               organization: organization)
      end
      # calling collection_to_link on the child will create a link to the parent dashboard
      let!(:collection_to_link) do
        create(:collection,
               name: 'Business Unit Dashboard',
               parent_collection: dashboard_collection,
               organization: organization)
      end

      before do
        dashboard_collection.parent_collection_card.update(
          width: 3,
          height: 2,
        )
      end

      it 'links to the dashboard at the 0,0 position with 3x2 size' do
        perform
        link = user.current_user_collection.collection_cards.first
        # link to the org collection within the root application collection
        expect(link.collection_id).to eq(dashboard_collection.id)
        expect(link.width).to eq(3)
        expect(link.height).to eq(2)
        expect(link.row).to eq(0)
        expect(link.col).to eq(0)
      end

      context 'when both objects are shared' do
        before do
          LinkToSharedCollectionsWorker.new.perform(
            users_to_add.map(&:id),
            groups_to_add.map(&:id),
            [collection_to_link.id, dashboard_collection.id],
            [],
          )
        end

        it 'does not create duplicate link' do
          expect(
            user.current_shared_collection
                .collection_cards
                .link
                .where(collection_id: dashboard_collection.id)
                .count,
          ).to eq(1)
        end
      end
    end

    context 'when the link is an item' do
      let!(:collection_to_link) { nil }
      let!(:parent_collection) { create(:collection, organization: organization) }
      let!(:item_to_link) { create(:text_item, parent_collection: parent_collection) }

      it 'calls CollectionCardBuilder with item id' do
        perform
        expect(CollectionCardBuilder).to have_received(:call).with(
          params: hash_including(
            item_id: item_to_link.id,
            collection_id: nil,
            width: 1,
            height: 1,
            row: nil,
            col: nil,
          ),
          parent_collection: anything,
          type: 'link',
        ).exactly(3).times
      end
    end

    context 'with multiple users' do
      let(:users_to_add) { create_list(:user, 2, add_to_org: organization) }

      it 'should create two links for every user' do
        perform
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
