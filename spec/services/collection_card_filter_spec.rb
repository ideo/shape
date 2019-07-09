require 'rails_helper'

RSpec.describe CollectionCardFilter, type: :service do
  describe '#viewable_by' do
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
             record_type: :collection)
    end
    let(:filters) { {} }
    let(:application) { nil }
    let(:cards) { collection.collection_cards }
    let(:visible_card_1) { cards[0] }
    let(:visible_card_2) { cards[1] }
    let(:hidden_card) { cards[2] }
    let(:private_card) { cards[3] }
    let!(:archived_card) { cards[4] }
    before do
      # Add viewer to group
      viewer.add_role(Role::VIEWER, group)
      # And group to collection
      group.add_role(Role::VIEWER, collection)

      # Add editor directly to collection
      editor.add_role(Role::EDITOR, collection)

      cards.each do |card|
        # Don't add group/viewer role to the private card
        group.add_role(Role::VIEWER, card.record) unless card == private_card
        editor.add_role(Role::EDITOR, card.record)
      end

      # Anchor visible and hidden cards
      [visible_card_1, visible_card_2, hidden_card].each do |card|
        card.record.update(roles_anchor_collection: collection)
      end

      # Hide the hidden card
      hidden_card.update(hidden: true)

      # Make private card private
      record = private_card.record
      record.cached_inheritance = { private: true, updated_at: Time.current }
      record.roles_anchor_collection = nil
      record.save

      # Archive the last card
      archived_card.archive!
    end
    subject do
      CollectionCardFilter.call(
        collection: collection,
        user: user,
        filters: filters,
        application: application,
      )
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
        cc_filter = CollectionCardFilter.call(
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

    context 'as a viewer' do
      let!(:user) { viewer }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          [visible_card_1, visible_card_2],
        )
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards user has permission to see' do
          expect(subject).to match_array(
            [visible_card_1, visible_card_2, hidden_card],
          )
        end
      end
    end

    context 'as an editor' do
      let!(:user) { editor }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          [visible_card_1, visible_card_2],
        )
      end
    end

    context 'as a super admin' do
      let!(:user) { super_admin }

      it 'returns all public or private, non-hidden cards' do
        expect(subject).to match_array(
          [visible_card_1, visible_card_2, private_card],
        )
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards' do
          expect(subject).to match_array(
            [visible_card_1, visible_card_2, hidden_card, private_card],
          )
        end
      end
    end

    context 'with no user (#filter_for_public)' do
      it 'returns all cards with same role as collection' do
        expect(subject).to match_array(
          [visible_card_1, visible_card_2],
        )
      end
    end

    context 'with common resource group' do
      let(:common_resource_group) { create(:global_group, :common_resource) }
      let(:user) { create(:user) }

      before do
        common_resource_group.add_role(Role::VIEWER, collection)
      end

      it 'returns all cards that common resource group can view' do
        expect(subject).to match_array(
          [visible_card_1, visible_card_2],
        )
      end
    end

    context 'with external_id filter' do
      let!(:application) { create(:application) }
      let!(:external_record) do
        create(
          :external_record,
          external_id: 'creative-difference-item',
          externalizable: visible_card_2.record,
          application: application,
        )
      end
      let!(:filters) do
        { external_id: 'creative-difference-card' }
      end

      it 'returns all card that has item with external id' do
        expect(subject).to match_array(
          [visible_card_2],
        )
      end
    end
  end
end
