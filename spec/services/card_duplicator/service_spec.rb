require 'rails_helper'

RSpec.describe CardDuplicator::Service, type: :service do
  let!(:user) { create(:user) }
  let!(:collection) { create(:collection, num_cards: 3, add_editors: [user]) }
  let!(:to_collection) { create(:collection, num_cards: 2, add_editors: [user]) }
  let!(:subcollection) { create(:collection, num_cards: 2, parent_collection: collection, add_editors: [user]) }
  let(:placement) { :beginning }
  let(:cards) { collection.collection_cards }
  let(:user_initiated) { nil }
  let(:for_user) { user }
  let(:duplicated_cards) { card_duplicator.context.duplicated_cards }
  let(:synchronous) { false }

  let(:card_duplicator) do
    CardDuplicator::Service.new(
      to_collection: to_collection,
      placement: placement,
      cards: cards,
      for_user: for_user,
      user_initiated: user_initiated,
      synchronous: synchronous,
    )
  end

  describe 'CreateCards' do
    it 'should create duplicate cards of all the original cards' do
      expect {
        card_duplicator.call
      }.to change(CollectionCard, :count).by(4)
      expect(duplicated_cards.count).to eq cards.count
      # cloned_from_id should reference the original
      expect(duplicated_cards.map(&:record).map(&:cloned_from_id)).to match_array(
        cards.map(&:record).map(&:id),
      )
    end

    context 'with items' do
      it 'should create duplicate items of all the original items' do
        expect {
          card_duplicator.call
        }.to change(Item, :count).by(3)
      end

      it 'should recalculate the breadcrumb of the new items' do
        card_duplicator.call
        expect(duplicated_cards.first.item.breadcrumb).to eq [to_collection.id]
      end
    end

    context 'with collections' do
      let(:duplicate_collection) do
        duplicated_cards.select { |cc| cc.collection_id.present? }.first&.record
      end

      it 'should create duplicate collections of all the original collections' do
        expect {
          card_duplicator.call
        }.to change(Collection, :count).by(1)
      end

      context 'with archived collection' do
        let!(:subcollection) { create(:collection, archived: true, parent_collection: collection) }

        it 'creates a duplicate that is not archived' do
          card_duplicator.call
          expect(subcollection.archived?).to be true
          expect(duplicate_collection.archived?).to be false
        end
      end

      context 'with shared_with_organization' do
        let!(:subcollection) { create(:collection, shared_with_organization: true, parent_collection: collection) }

        it 'nullifies shared_with_organization' do
          card_duplicator.call
          expect(subcollection.shared_with_organization?).to be true
          expect(duplicate_collection.shared_with_organization?).to be false
        end
      end

      # NOTE: actually testing SubcollectionDuplicationWorker...
      context 'with hidden sub-items' do
        let!(:hidden_item) { subcollection.items.first }
        let!(:viewable_items) { subcollection.items - [hidden_item] }
        let(:duplicated_sub_items) { duplicate_collection.items }
        let(:synchronous) { true }

        before do
          hidden_item.unanchor_and_inherit_roles_from_anchor!
          user.remove_role(Role::EDITOR, hidden_item)
          card_duplicator.call
          duplicate_collection.reload
        end

        it 'duplicates only items viewable by for_user' do
          items_cloned_from = duplicated_sub_items.map(&:cloned_from)
          expect(items_cloned_from).to match_array(viewable_items)
          expect(items_cloned_from).not_to include(hidden_item)
        end

        context 'without a for_user' do
          let(:for_user) { nil }

          it 'duplicates all items' do
            items_cloned_from = duplicated_sub_items.map(&:cloned_from)
            expect(items_cloned_from).to match_array(subcollection.items)
            expect(items_cloned_from).to include(hidden_item)
          end
        end
      end

      context 'with link cards' do
        let!(:collection) do
          create(:collection, num_cards: 3, record_type: :link_text, card_relation: :link)
        end
        let(:subcollection) { nil }

        context 'with user_initiated = false' do
          let(:user_initiated) { false }

          it 'should just copy the links as links' do
            expect {
              card_duplicator.call
            }.to change(CollectionCard::Link, :count).by(3)
          end
        end

        context 'with user_initiated = true' do
          let(:user_initiated) { true }

          it 'should convert the links into primary cards with records' do
            expect {
              card_duplicator.call
            }.to change(CollectionCard::Primary, :count).by(3)
          end
        end

        context 'with a subcollection with link cards' do
          let!(:subcollection) do
            create(:collection, parent_collection: collection, num_cards: 3, record_type: :link_text, card_relation: :link)
          end
          let(:synchronous) { true }
          let(:for_user) { nil }

          context 'with user_initiated = false' do
            let(:user_initiated) { false }

            it 'should just copy the links as links' do
              expect {
                card_duplicator.call
              }.to change(CollectionCard::Link, :count).by(6).and(
                # 1 for the subcollection
                change(CollectionCard::Primary, :count).by(1),
              )
            end
          end

          context 'with user_initiated = true' do
            let(:user_initiated) { true }

            it 'should preserve link cards inside of subcollections' do
              expect {
                card_duplicator.call
              }.to change(CollectionCard::Link, :count).by(3).and(
                # 3 for the top-level links + 1 for the subcollection
                change(CollectionCard::Primary, :count).by(4),
              )
            end
          end
        end
      end

      context 'duplicating a template' do
        let!(:template_subcollection) { create(:collection, num_cards: 2, master_template: true, parent_collection: collection) }
        let(:duplicate_collection) do
          duplicated_cards.select { |cc| cc.collection_id.present? && cc.collection.cloned_from == template_subcollection }.first&.record
        end

        before do
          card_duplicator.call
        end

        it 'copies as a master template' do
          expect(duplicate_collection.master_template?).to eq true
        end

        context 'into a template instance' do
          let!(:to_collection_template) { create(:collection, num_cards: 1, master_template: true) }
          let!(:to_collection) { create(:collection, num_cards: 1, add_editors: [user], template: to_collection_template) }

          it 'creates an instance of the template, and not a master template' do
            expect(duplicate_collection.template).to eq template_subcollection
            expect(duplicate_collection.master_template?).to eq false
          end
        end
      end
    end

    context 'placement = beginning' do
      let(:subcollection) { nil }

      before do
        card_duplicator.call
      end

      it 'should place cards at the beginning' do
        first_cards = to_collection.reload.collection_cards.first(3)
        # newly created cards should be duplicates
        expect(first_cards.map(&:id)).to match_array duplicated_cards.map(&:id)
        expect(first_cards.map(&:item)).not_to match_array cards.map(&:item)
        # names should match, in same order
        expect(first_cards.map(&:item).map(&:name)).to eq cards.map(&:item).map(&:name)
        expect(to_collection.collection_cards.first.primary?).to be true
        expect(to_collection.collection_cards.count).to eq 5
      end
    end

    context 'placement = end' do
      let(:placement) { 'end' }
      let(:subcollection) { nil }

      before do
        card_duplicator.call
      end

      it 'should place cards at the end' do
        last_cards = to_collection.reload.collection_cards.last(3)
        # newly created cards should be duplicates
        expect(last_cards.map(&:id)).to match_array duplicated_cards.map(&:id)
        expect(last_cards.map(&:item)).not_to match_array cards.map(&:item)
        # names should match, in same order
        expect(last_cards.map(&:item).map(&:name)).to eq cards.map(&:item).map(&:name)
        expect(to_collection.collection_cards.first.primary?).to be true
        expect(to_collection.collection_cards.count).to eq 5
      end
    end

    context 'when to_collection is a foamcore board' do
      let!(:to_collection) { create(:board_collection, num_cards: 3, add_editors: [user]) }
      let(:target_empty_row) { to_collection.empty_row_for_moving_cards }

      it 'sets row of duplicated cards 2 rows after the last non-blank row' do
        card_duplicator.call
        duplicated_cards.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq target_empty_row
          expect(card.col).to eq index
        end
      end
    end
  end

  describe 'DuplicateExternalRecords' do
    let!(:external_records) do
      cards.map(&:record).map do |record|
        create(:external_record, externalizable: record)
      end
    end

    it 'should create duplicate external records' do
      expect {
        card_duplicator.call
      }.to change(ExternalRecord, :count).by(4)

      item = duplicated_cards.first.item.reload
      expect(item.external_records.count).to eq 1
    end
  end

  describe 'DuplicateFilestackFiles' do
    let(:user_initiated) { false }
    let!(:collection) { create(:collection, num_cards: 3, record_type: :image) }

    it 'should create duplicate filestack files' do
      expect {
        card_duplicator.call
      }.to change(FilestackFile, :count).by(3)
      items = cards.map(&:item).compact
      # reload items to ensure that filestackfile relationship has persisted
      new_items = duplicated_cards.map(&:item).compact.map(&:reload)
      expect(new_items.map(&:filestack_file).map(&:filename)).to match_array(
        items.map(&:filestack_file).map(&:filename),
      )
    end

    context 'with link cards' do
      let!(:collection) { create(:collection, num_cards: 3, record_type: :link_image, card_relation: :link) }

      it 'should skip filestack files that are from link cards' do
        expect {
          card_duplicator.call
        }.not_to change(FilestackFile, :count)
      end

      context 'with user_initiated = true' do
        let(:user_initiated) { true }

        it 'should create duplicate filestack files' do
          expect {
            card_duplicator.call
          }.to change(FilestackFile, :count).by(3)
        end
      end
    end
  end

  describe 'DuplicateSubcollections' do
    let(:synchronous) { true }

    it 'should duplicate the subcollections' do
      expect {
        card_duplicator.call
      }.to change(Collection, :count).by(1)
      dupe_subcollection_card = duplicated_cards.select { |cc| cc.collection_id.present? }.first
      dupe_subcollection = dupe_subcollection_card.record
      expect(dupe_subcollection_card).not_to be nil
      expect(dupe_subcollection.cloned_from).to eq subcollection
      expect(dupe_subcollection.collection_cards.count).to eq 2
    end

    context 'with a subcollection inside the system-generated getting started collection' do
      let(:organization) { create(:organization_without_groups) }
      let(:collection) { create(:global_collection, organization: organization) }
      let!(:subcollection) do
        create(:collection, parent_collection: collection, organization: organization)
      end
      let!(:will_become_shell_collection) do
        # needs some cards in order to ever hit SubcollectionDuplicationWorker
        create(:collection, num_cards: 2, parent_collection: subcollection, organization: organization)
      end
      let(:shell_collection) { to_collection.collections.first.collections.first }
      let(:for_user) { nil }

      before do
        organization.update(getting_started_collection: collection)
        card_duplicator.call
      end

      it 'should mark the duplicate child collection as a getting_started_shell' do
        expect(shell_collection.getting_started_shell).to be true
      end

      it 'should not create any collection cards in the child collection' do
        expect(shell_collection.cloned_from).to eq subcollection.collections.first
        expect(shell_collection.cloned_from.collection_cards.count).to eq 2
        expect(shell_collection.collection_cards.count).to eq 0
      end
    end
  end

  describe 'ProcessCollection' do
    it 'should update cached_card_count' do
      expect {
        card_duplicator.call
        to_collection.reload
      }.to change(to_collection, :cached_card_count)
    end

    it 'should update cached_cover' do
      expect {
        card_duplicator.call
        to_collection.reload
      }.to change(to_collection, :cached_cover)
    end
  end

  describe 'DuplicateLegendItems', only: true do
    let!(:data_item) do
      create(
        :data_item,
        :report_type_record,
        parent_collection: collection,
      )
    end
    let(:legend_item) { data_item.legend_item }
    let(:duplicated_data_items) do
      to_collection.collection_cards.map(&:item).compact.select do |item|
        item.is_a?(Item::DataItem)
      end
    end

    before do
      legend_item.reload # to make sure data_item_ids aren't cached
      # cards.push(data_item.parent_collection_card)
      user.add_role(Role::EDITOR, data_item)
    end

    it 'links legend to duplicated data item' do
      card_duplicator.call
      to_collection.reload

      expect(duplicated_data_items.size).to eq(1)
      expect(duplicated_data_items.first.cloned_from).to eq(data_item)
    end

    context 'if legend is not selected' do
      let(:cards) do
        collection.collection_cards.reject { |cc| cc.record.is_a?(Item::LegendItem) }
      end

      before do
        expect(cards).not_to include(legend_item.parent_collection_card)
      end

      it 'duplicates legend' do
        expect {
          card_duplicator.call
        }.to change(Item::LegendItem, :count).by(1)
      end
    end

    context 'if legend is selected' do
      it 'duplicates it' do
        # binding.pry
        expect {
          card_duplicator.call
        }.to change(Item::LegendItem, :count).by(1)
      end
    end

    context 'with legend linked to other data items not duplicated' do
      let!(:data_item_two) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: collection,
          legend_item: legend_item,
        )
      end

      before do
        user.add_role(Role::EDITOR, data_item_two)
      end

      it 'duplicates legend' do
        expect {
          card_duplicator.call
        }.to change(Item::LegendItem, :count).by(1)
      end

      it 'leaves existing data item linked to legend item' do
        card_duplicator.call
        to_collection_legend_items = to_collection.collection_cards.reload.select do |card|
          card.item&.is_a?(Item::LegendItem)
        end.map(&:item)
        expect(
          to_collection_legend_items.size,
        ).to eq(1)
        duplicated_legend_item = to_collection_legend_items.first
        expect(data_item_two.reload.legend_item).not_to eq(duplicated_legend_item)
      end
    end

  end
end
