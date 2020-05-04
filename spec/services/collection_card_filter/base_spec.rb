require 'rails_helper'

RSpec.describe CollectionCardFilter::Base, type: :service do
  describe '#call (Collection#collection_cards_viewable_by)' do
    let(:user) { nil }
    let(:editor) { create(:user) }
    let(:viewer) { create(:user) }
    let(:super_admin) do
      user = create(:user)
      user.add_role(Role::SUPER_ADMIN)
      user
    end
    let(:organization) { create(:organization, admin: editor, member: viewer) }
    let!(:group) { create(:group, organization: organization) }
    let!(:collection) do
      create(:collection,
             organization: organization,
             num_cards: 5,
             record_type: :collection,
             add_viewers: [viewer])
    end
    let(:filters) { {} }
    let(:application) { nil }
    let(:cards) { collection.collection_cards }
    let(:visible_card_1) { cards[0] }
    let(:visible_card_2) { cards[1] }
    let(:visible_cards) { [visible_card_1, visible_card_2] }
    let(:hidden_card) { cards[2] }
    let(:private_card) { cards[3] }
    let!(:archived_card) { cards[4] }
    let(:ids_only) { false }
    before do
      # And group to collection
      group.add_role(Role::VIEWER, collection)

      # Add editor directly to collection
      editor.add_role(Role::EDITOR, collection)

      cards.each do |card|
        record = card.record
        record.unanchor!
        editor.add_role(Role::EDITOR, record)
        if card == private_card
          # Make private card private
          record.cached_inheritance = { private: true, updated_at: Time.current }
          record.save
        else
          # Don't add group/viewer role to the private card
          group.add_role(Role::VIEWER, record)
        end
      end

      # Anchor visible and hidden cards
      [visible_card_1, visible_card_2, hidden_card].each do |card|
        card.record.update(roles_anchor_collection: collection)
      end

      # Hide the hidden card
      hidden_card.update(hidden: true)

      # Archive the last card
      archived_card.archive!
    end
    subject do
      CollectionCardFilter::Base.call(
        collection: collection,
        user: user,
        filters: filters,
        application: application,
        ids_only: ids_only,
      )
    end

    context 'as a viewer' do
      let!(:user) { viewer }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(visible_cards)
      end

      context 'regular collection' do
        let!(:filters) do
          {
            page: 2,
          }
        end

        it 'filters by given page/per_page' do
          # Default per_page is made to be at least 50,
          # so best way to test is to make sure we didn't receive any cards -- though not ideal
          expect(subject).to be_empty
        end
      end

      context 'with board collection' do
        before do
          collection.update(type: 'Collection::Board')

          cards.each_with_index do |card, i|
            card.update(
              row: 1,
              col: i + 1,
            )
          end
        end
        let!(:filters) do
          {
            rows: [0, 1],
            cols: [2, 3],
          }
        end

        it 'filters by row/col' do
          # Must re-instantiate subject so we can cast board to right class
          cc_filter = CollectionCardFilter::Base.call(
            collection: collection.becomes(Collection::Board),
            user: user,
            filters: filters,
          )
          expect(cc_filter).to eq(
            [
              visible_card_2,
            ],
          )
        end
      end

      context 'with an archived collection' do
        before do
          collection.reload.archive!
          # put this card in a different batch
          visible_card_2.update(archive_batch: 'xyz')
        end

        it 'should return all cards archived in the same batch as parent' do
          expect(subject).to match_array(
            [visible_card_1],
          )
        end
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards user has permission to see' do
          expect(subject).to match_array(
            visible_cards + [hidden_card],
          )
        end
      end

      context 'with a filter query' do
        let!(:filters) { { q: 'plant', page: 1 } }

        before do
          visible_card_1.record.update(
            name: 'a plant',
          )
          Collection.reindex
          Collection.searchkick_index.refresh
        end

        it 'should only return the cards that match the filter query' do
          expect(subject).to match_array(
            [visible_card_1],
          )
        end
      end

      context 'with ids_only setting' do
        let(:ids_only) { true }

        it 'returns ids and orders of all visible cards' do
          data = visible_cards.map do |cc|
            { id: cc.id.to_s, order: cc.order }
          end
          expect(subject).to match_array(data)
        end
      end
    end

    context 'as an editor' do
      let!(:user) { editor }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          visible_cards + [private_card],
        )
      end
    end

    context 'as a super admin' do
      let!(:user) { super_admin }

      it 'returns all public or private, non-hidden cards' do
        expect(subject).to match_array(
          visible_cards + [private_card],
        )
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards' do
          expect(subject).to match_array(
            visible_cards + [hidden_card, private_card],
          )
        end
      end
    end

    context 'with no user' do
      it 'returns no visible cards' do
        expect(subject).to match_array([])
      end

      context 'anyone_can_view' do
        before do
          collection.update(anyone_can_view: true)
        end

        it 'returns all cards with same role as collection' do
          expect(subject).to match_array(
            [visible_card_1, visible_card_2],
          )
        end
      end
    end

    context 'with common resource group' do
      let(:common_resource_group) { create(:global_group, :common_resource) }
      let(:user) { create(:user) }

      before do
        common_resource_group.add_role(Role::VIEWER, collection)
      end

      it 'returns all cards that common resource group can view' do
        expect(subject).to match_array(visible_cards)
      end
    end

    context 'with external_id filter' do
      let!(:application) { create(:application) }
      let(:user) { create(:user, :application_bot, application: application) }
      let!(:external_record) do
        create(
          :external_record,
          external_id: 'creative-difference-card',
          externalizable: visible_card_2.record,
          application: application,
        )
      end
      let!(:filters) do
        { external_id: 'creative-difference-card' }
      end
      before do
        # make sure application_bot can view the collection
        user.add_role(Role::VIEWER, collection)
      end

      it 'returns card that has collection with external id' do
        expect(subject).to match_array(
          [visible_card_2],
        )
      end
    end

    context 'with groups' do
      let(:user) { create(:user, current_organization: organization) }
      let!(:child_group) { create(:group, organization: organization) }
      let!(:group) { create(:group, organization: organization, add_subgroups: [child_group]) }
      before do
        group.add_role(Role::VIEWER, private_card.record)
      end

      it 'returns no visible cards when user is not a viewer or member of any group' do
        expect(collection.can_view?(user)).to be false
        expect(subject).to match_array([])
      end

      context 'when user is a(ny) member of a group that is a subgroup of another group' do
        let!(:child_group) { create(:group, organization: organization, add_members: [user]) }

        it 'returns all cards that the farthest away ancestor group can view' do
          expect(collection.can_view?(user)).to be true
          expect(subject).to match_array([visible_card_1, visible_card_2, private_card])
        end
      end
    end
  end
end
