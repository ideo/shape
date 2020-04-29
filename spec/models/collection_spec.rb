require 'rails_helper'

describe Collection, type: :model do
  context 'validations' do
    it { should validate_presence_of(:organization).with_message('must exist') }
    it { should validate_presence_of(:name) }
    it 'does not validate presence of :name if not base_collection_type' do
      expect(Collection::UserCollection.new).not_to validate_presence_of(:name)
    end
  end

  context 'associations' do
    it { should have_many :collection_cards }
    it { should have_many :primary_collection_cards }
    it { should have_many :link_collection_cards }
    it { should have_many :cards_linked_to_this_collection }
    it { should have_many :items }
    it { should have_many :collections }
    it { should have_one :parent_collection_card }
    it { should belong_to :cloned_from }
    it { should belong_to :organization }
    it { should belong_to :template }
    it { should belong_to :joinable_group }
    # these come from Testable concern
    it { should have_many :test_collections }
    it { should have_one :live_test_collection }
    # from Commentable
    it { should have_many :comment_threads }

    describe '#collection_cards' do
      let!(:collection) { create(:collection, num_cards: 3) }
      let(:collection_cards) { collection.collection_cards }

      it 'should find collection cards in order of order: :asc' do
        expect(collection_cards.sort_by(&:order)).to match_array(collection_cards)
      end

      it 'should only find active collection cards' do
        expect do
          collection_cards.first.archive!
        end.to change(collection.collection_cards, :count).by(-1)
      end

      describe '#touch_related_cards' do
        let!(:collection) { create(:collection) }
        let!(:card_linked_to_this_collection) { create(:collection_card_link, collection: collection) }

        it 'should update linked cards if updated_at changed' do
          expect do
            collection.update(updated_at: Time.now) && card_linked_to_this_collection.reload
          end.to change(card_linked_to_this_collection, :updated_at)
        end
        it 'should update linked cards after update' do
          expect do
            collection.update(name: 'Bobo') && card_linked_to_this_collection.reload
          end.to change(card_linked_to_this_collection, :updated_at)
        end
      end
    end

    describe '.build_ideas_collection' do
      it 'returns unpersisted collection with one ideas card' do
        collection = Collection.build_ideas_collection
        cards = collection.primary_collection_cards
        expect(collection.new_record?).to be true
        expect(collection.name).to eq('Ideas')
        expect(cards.size).to eq(1)
        expect(cards.first.item.question_type).to eq('question_idea')
      end
    end

    describe '#collection_cover_cards' do
      let!(:collection) { create(:collection, num_cards: 3) }
      let(:collection_cards) { collection.collection_cards }

      it 'should return [] if no cards are covers' do
        expect(collection_cards.all? { |card| !card.is_cover? }).to be true
        expect(collection.collection_cover_cards).to be_empty
      end

      it 'returns no collection_cover_items' do
        expect(collection.collection_cover_items).to be_empty
      end

      context 'with one card marked as cover' do
        let(:cover_card) { collection_cards.first }
        before { cover_card.update(is_cover: true) }

        it 'is returned' do
          expect(collection.collection_cover_cards).to eq([cover_card])
        end

        it 'collection_cover_items returns card item' do
          expect(collection.collection_cover_items).to eq([cover_card.item])
        end
      end
    end

    describe '#destroy' do
      let(:user) { create(:user) }
      let!(:collection) { create(:collection, num_cards: 3, add_editors: [user]) }
      let(:items) { collection.items }
      let(:collection_cards) { collection.collection_cards }

      it 'should destroy all related cards and items' do
        expect(collection.roles.count).to eq 1
        expect(items.count).to eq 3
        expect(collection_cards.count).to eq 3
        collection.destroy
        expect(collection.roles.count).to eq 0
        expect(items.count).to eq 0
        expect(collection_cards.count).to eq 0
      end
    end
  end

  describe 'callbacks' do
    describe '#pin_all_primary_cards' do
      let!(:collection) { create(:collection, num_cards: 3) }

      it 'pins cards if master_template = true' do
        expect(collection.primary_collection_cards.any?(&:pinned?)).to be false
        collection.update(master_template: true)
        expect(collection.reload.primary_collection_cards.all?(&:pinned?)).to be true
      end
    end

    describe '#add_joinable_guest_group' do
      let(:organization) { create(:organization) }
      let!(:collection) { create(:collection, organization: organization) }
      let(:guest_group) { collection.organization.guest_group }

      it 'sets the org guest group as the joinable_group when anyone_can_join is set to true' do
        expect(collection.can_view?(guest_group)).to be false
        collection.update(anyone_can_join: true)
        guest_group.reset_cached_roles!
        # adds group as viewer
        expect(collection.can_view?(guest_group)).to be true
        # sets the joinable group
        expect(collection.joinable_group_id).to eq guest_group.id
      end
    end
  end

  describe '#inherit_parent_organization_id' do
    let!(:parent_collection) { create(:user_collection) }
    let!(:collection_card) { create(:collection_card, parent: parent_collection) }
    let!(:collection) { create(:collection, name: 'New Collection', organization: nil, parent_collection_card: collection_card) }

    it 'inherits organization id from parent collection' do
      expect(collection.organization_id).to eq(parent_collection.organization_id)
    end
  end

  describe '#enable_org_view_access_if_allowed' do
    let!(:organization) { create(:organization) }
    let(:parent_collection) { create(:collection, organization: organization) }
    let(:collection) { create(:collection, organization: organization, parent_collection: parent_collection) }

    context 'if parent is user collection' do
      let(:parent_collection) do
        create(:user_collection, organization: organization)
      end

      it 'does give view access' do
        expect(collection.enable_org_view_access_if_allowed).to be true
        expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be true
      end

      context 'if cloned from Getting Started collection' do
        let!(:getting_started_template_collection) do
          create(:getting_started_template_collection,
                 organization: organization)
        end
        before do
          organization.reload
          collection.update_attributes(
            cloned_from: getting_started_template_collection,
          )
        end

        it 'does not give view access' do
          expect(organization.getting_started_collection).to eq(getting_started_template_collection)
          expect(collection.enable_org_view_access_if_allowed).to be false
          expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
        end
      end
    end

    context 'if cloned from a parent of a Getting Started collection' do
      let!(:getting_started_template_collection) do
        create(:getting_started_template_collection,
               organization: organization)
      end
      let(:cloned) { create(:collection, organization: organization, parent_collection: getting_started_template_collection) }

      before do
        organization.reload
        collection.update_attributes(
          cloned_from: cloned,
        )
      end

      it 'does not give view access' do
        expect(organization.getting_started_collection).to eq(getting_started_template_collection)
        expect(collection.enable_org_view_access_if_allowed).to be false
        expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
      end
    end

    context 'if parent is not user collection' do
      let(:parent_collection) { create(:collection, organization: organization) }

      it 'does not give view access to its organization\'s primary group' do
        expect(collection.enable_org_view_access_if_allowed).to be false
        expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
      end
    end

    describe '#reindex_sync' do
      let(:collection) { create(:collection) }

      before do
        allow(Searchkick).to receive(:callbacks).and_call_original
      end

      it 'should get called on create' do
        expect(Searchkick).to receive(:callbacks).with(true)
        collection.save
      end

      it 'should get called after archive' do
        # once on create, second for archive
        expect(Searchkick).to receive(:callbacks).with(true).twice
        collection.archive!
      end
    end
  end

  describe '#duplicate!' do
    let!(:user) { create(:user) }
    let!(:parent_collection_user) { create(:user) }
    let!(:collection_user) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:parent_collection) { create(:collection, organization: organization) }
    let!(:collection) do
      create(:collection, num_cards: 3, tag_list: %w[Prototype Other], organization: organization)
    end
    let!(:parent_collection_card) do
      create(:collection_card_collection, parent: parent_collection, collection: collection)
    end
    let(:copy_parent_card) { false }
    let(:parent) { collection.parent }
    let(:batch_id) { "duplicate-#{SecureRandom.hex(10)}" }
    let(:card) { nil }
    let(:building_template_instance) { false }
    let(:duplicate) do
      dupe = collection.duplicate!(
        for_user: user,
        copy_parent_card: copy_parent_card,
        parent: parent,
        batch_id: batch_id,
        card: card,
        building_template_instance: building_template_instance,
      )
      # Necessary because AR-relationship is cached
      user.roles.reload
      user.reset_cached_roles!
      dupe
    end

    it 'does not duplicate if no flag passed' do
      expect(duplicate.parent_collection_card).to be_nil
    end

    context 'with archived collection' do
      let!(:collection) { create(:collection, num_cards: 3, archived: true, tag_list: %w[Prototype Other]) }

      it 'creates a duplicate that is not archived' do
        expect(collection.archived?).to be true
        expect(duplicate.archived?).to be false
      end
    end

    context 'enabling org view access' do
      let(:copy_parent_card) { true }

      it 'should not share with the org by default' do
        expect(organization.primary_group.has_role?(Role::VIEWER, duplicate)).to be false
      end

      context 'duplicating into a user_collection' do
        let!(:parent_collection) { create(:user_collection, organization: organization) }

        it 'should share with the org' do
          expect(organization.primary_group.has_role?(Role::VIEWER, duplicate)).to be true
        end
      end
    end

    context 'with shared_with_organization' do
      before do
        collection.update(shared_with_organization: true)
      end

      it 'nullifies shared_with_organization' do
        expect(collection.shared_with_organization?).to be true
        expect(duplicate.shared_with_organization?).to be false
      end
    end

    context 'without user' do
      let(:duplicate_without_user) do
        dupe = collection.duplicate!(
          copy_parent_card: true,
          parent: parent,
          batch_id: batch_id,
        )
        user.roles.reload
        user.reset_cached_roles!
        dupe
      end

      it 'clones the collection' do
        expect { duplicate_without_user }.to change(Collection, :count).by(1)
      end

      it 'clones all the collection cards' do
        expect(CollectionCardDuplicationWorker).to receive(:perform_async).with(
          batch_id,
          collection.collection_cards.map(&:id),
          instance_of(Integer),
          nil, # <-- nil user_id
          false,
          false,
          false,
        )
        duplicate_without_user
      end

      it 'clones all roles from parent collection - but not user' do
        expect(duplicate_without_user.editors[:users].map(&:email)).to match(
          parent.editors[:users].map(&:email),
        )
        expect(duplicate_without_user.can_edit?(user)).to be false
      end
    end

    context 'with copy_parent_card true' do
      let!(:copy_parent_card) { true }

      it 'creates duplicate with parent_collection as its parent' do
        expect(duplicate.id).not_to eq(collection.id)
        expect(duplicate.parent).to eq parent_collection
      end

      it 'creates duplicate with organization_id matching parent' do
        expect(duplicate.organization_id).to eq parent_collection.organization_id
      end
    end

    context 'with editor role' do
      before do
        user.add_role(Role::EDITOR, parent)
        user.add_role(Role::EDITOR, collection)
        parent_collection_user.add_role(Role::EDITOR, parent)
        collection_user.add_role(Role::EDITOR, collection)
        collection.items.each do |item|
          user.add_role(Role::EDITOR, item)
        end
        collection.reload
      end

      it 'clones the collection' do
        expect { duplicate }.to change(Collection, :count).by(1)
        expect(collection.id).not_to eq(duplicate.id)
      end

      it 'references the current collection as cloned_from' do
        expect(duplicate.cloned_from).to eq(collection)
      end

      it 'clones all the collection cards' do
        expect(CollectionCardDuplicationWorker).to receive(:perform_async).with(
          batch_id,
          collection.collection_cards.map(&:id),
          instance_of(Integer),
          user.id,
          false,
          false,
          false,
        )
        collection.duplicate!(
          for_user: user,
          batch_id: batch_id,
        )
      end

      it 'clones all roles from parent collection' do
        expect(duplicate.editors[:users].map(&:email)).to match(parent.editors[:users].map(&:email))
        expect(duplicate.can_edit?(user)).to be true
      end

      it 'clones all roles on items' do
        expect(duplicate.items.all? { |item| item.can_edit?(user) }).to be true
      end

      it 'clones tag list' do
        expect(duplicate.tag_list).to match_array collection.tag_list
      end
    end

    context 'with system_collection and synchronous settings' do
      let(:instance_double) do
        double('CollectionCardDuplicationWorker')
      end

      before do
        allow(CollectionCardDuplicationWorker).to receive(:new).and_return(instance_double)
        allow(instance_double).to receive(:perform).and_return true
      end

      it 'should call synchronously' do
        expect(CollectionCardDuplicationWorker).to receive(:new)
        expect(instance_double).to receive(:perform).with(
          batch_id,
          anything,
          anything,
          anything,
          true,
          true,
          false,
        )
        collection.duplicate!(
          batch_id: batch_id,
          for_user: user,
          system_collection: true,
          synchronous: true,
        )
      end
    end

    context 'with building_template_instance' do
      let(:building_template_instance) { true }
      before do
        collection.update(master_template: true)
      end

      it 'should set the template to itself, and set master_template = false' do
        expect(duplicate.template).to eq collection
        expect(duplicate.master_template?).to be false
      end

      it 'should pass building_template_instance to the worker' do
        expect(CollectionCardDuplicationWorker).to receive(:perform_async).with(
          batch_id,
          collection.collection_cards.map(&:id),
          instance_of(Integer),
          user.id,
          false,
          false,
          true, # <-- building_template_instance
        )
        duplicate
      end
    end

    context 'with a subcollection inside the system-generated getting started collection' do
      let(:parent_collection) { create(:global_collection, organization: organization) }
      let!(:subcollection) { create(:collection, num_cards: 2, parent_collection: collection, organization: organization) }
      let(:duplicate) do
        collection.duplicate!(
          for_user: user,
          copy_parent_card: copy_parent_card,
          parent: parent,
          system_collection: true,
          synchronous: true,
        )
      end
      let(:shell_collection) { duplicate.collections.first }

      before do
        organization.update(getting_started_collection: parent_collection)
        duplicate
      end

      it 'should mark the duplicate child collection as a getting_started_shell' do
        expect(shell_collection.getting_started_shell).to be true
      end

      it 'should not create any collection cards in the child collection' do
        expect(shell_collection.cloned_from).to eq subcollection
        expect(shell_collection.cloned_from.collection_cards.count).to eq 2
        expect(shell_collection.collection_cards.count).to eq 0
      end
    end

    context 'with external records' do
      let!(:external_records) do
        [
          create(:external_record, externalizable: collection, external_id: '100'),
          create(:external_record, externalizable: collection, external_id: '101'),
        ]
      end

      it 'duplicates external records' do
        expect(collection.external_records.reload.size).to eq(2)
        expect do
          duplicate
        end.to change(ExternalRecord, :count).by(2)

        expect(duplicate.external_records.pluck(:external_id)).to match_array(
          %w[100 101],
        )
      end
    end

    context 'with submission_attrs' do
      let!(:collection) { create(:collection, :submission) }

      it 'clears out submission_attrs' do
        expect(collection.submission?).to be true
        expect(duplicate.submission?).to be false
      end
    end

    context 'with passed in card' do
      let(:card) { create(:collection_card) }

      it 'sets the specified card as the parent' do
        expect(duplicate.parent_collection_card).to eq card
      end
    end

    context 'with collection filters' do
      let!(:collection_filter) { create(:collection_filter, collection: collection) }

      it 'copies all filters' do
        expect do
          duplicate
        end.to change(CollectionFilter, :count).by(1)
        expect(duplicate.collection_filters.first.text).to eq(collection_filter.text)
      end
    end
  end

  describe '#copy_all_cards_into!' do
    let(:source_collection) { create(:collection, num_cards: 3) }
    let(:target_collection) { create(:collection, num_cards: 2) }
    let(:first_record) { source_collection.collection_cards.first.record }

    it 'copies all cards from source to target, to the beginning' do
      source_collection.copy_all_cards_into!(target_collection, synchronous: true)
      target_collection.reload
      expect(target_collection.collection_cards.count).to eq 5
      expect(target_collection.collection_cards.first.record.cloned_from).to eq first_record
    end

    it 'copies all cards from source to target, to the specified order' do
      source_collection.copy_all_cards_into!(target_collection, synchronous: true, placement: 1)
      target_collection.reload
      # first record should still be the original target_collection card
      expect(target_collection.collection_cards.first.record.cloned_from).to be nil
      # check the second record
      expect(target_collection.collection_cards.second.record.cloned_from).to eq first_record
    end

    context 'with links' do
      let(:fake_parent) { create(:collection) }
      let(:source_collection) { create(:collection, num_cards: 3, record_type: :link_text, card_relation: :link) }
      before do
        # all these cards' linked records need corresponding parent_collection_cards for duplication
        source_collection.link_collection_cards.each do |cc|
          create(:collection_card, item: cc.record, parent: fake_parent)
        end
      end

      it 'preserves links as links and does not convert them into primary cards' do
        source_collection.copy_all_cards_into!(target_collection, synchronous: true)
        target_collection.reload
        expect(target_collection.collection_cards.count).to eq 5
        expect(target_collection.link_collection_cards.count).to eq 3
        expect(target_collection.link_collection_cards.first.record).to eq first_record
      end
    end
  end

  describe '#all_tag_names' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let(:cards) { collection.collection_cards }

    it 'should be empty by default' do
      expect(collection.all_tag_names).to match_array []
    end

    it 'should gather collection tags' do
      collection.update(tag_list: ['this', 'interstellar space dust'])
      expect(collection.reload.all_tag_names).to match_array ['this', 'interstellar space dust']
    end

    it 'should gather collection + item tags' do
      collection.update(tag_list: %w[this that])
      cards.first.item.update(tag_list: %w[other stuff])
      cards[1].item.update(tag_list: %w[more things])
      expect(collection.reload.all_tag_names).to match_array %w[this that other stuff more things]
    end
  end

  describe '#collection_cards_viewable_by' do
    let!(:collection) { create(:collection, num_cards: 3, record_type: :collection) }
    let!(:subcollection_card) { create(:collection_card_collection, order: 4, parent: collection) }
    let(:cards) { collection.collection_cards }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::VIEWER, collection)
      collection.collections.each do |coll|
        user.add_role(Role::VIEWER, coll)
      end
      user.add_role(Role::VIEWER, subcollection_card.collection)
    end

    it 'should show all cards without limiting' do
      expect(collection.collection_cards_viewable_by(user: user)).to match_array(cards)
    end

    context 'if one item is private' do
      let(:private_card) { cards[0] }

      before do
        private_card.record.unanchor_and_inherit_roles_from_anchor!
        user.remove_role(Role::VIEWER, private_card.record)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(user: user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(user: user)).to match_array(cards - [private_card])
      end
    end

    context 'if one subcollection is private' do
      let(:private_card) { subcollection_card }

      before do
        record = private_card.record.reload
        record.unanchor_and_inherit_roles_from_anchor!
        user.remove_role(Role::VIEWER, subcollection_card.collection)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(user: user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(user: user)).to match_array(cards - [private_card])
      end
    end

    context 'with card_order param' do
      it 'should return results according to the updated_at param' do
        viewable = collection.collection_cards_viewable_by(user: user, filters: { card_order: 'updated_at' })
        sorted = cards.sort_by(&:updated_at).reverse
        expect(viewable.first).to eq(sorted.first)
        expect(viewable.last).to eq(sorted.last)
      end

      it 'should return results according to the cached_test_scores sorting param' do
        scored1 = collection.collections.first
        scored1.update(cached_test_scores: { 'question_useful' => 30 })
        scored2 = collection.collections.last
        scored2.update(cached_test_scores: { 'question_useful' => 20 })

        viewable = collection.collection_cards_viewable_by(user: user, filters: { card_order: 'question_useful' })
        expect(viewable.first).to eq(scored1.parent_collection_card)
        expect(viewable.second).to eq(scored2.parent_collection_card)
      end
    end

    context 'with pagination' do
      it 'should only show the appropriate page' do
        # defaults to 50 records per page, so page 2 will be empty
        first_page = collection.collection_cards_viewable_by(user: user, filters: { page: 2 })
        expect(first_page).to be_empty
      end
    end

    context 'with hidden option' do
      before do
        collection.collection_cards.last.update(hidden: true)
      end

      it 'should only show the un-hidden cards' do
        expect(collection.collection_cards_viewable_by(user: user)).to match_array(cards.where(hidden: false))
      end
    end
  end

  describe '#collection_cards_by_page' do
    let!(:collection) { create(:collection, num_cards: 3, record_type: :collection) }

    it 'returns cards on page' do
      expect(collection.collection_cards_by_page(page: 2, per_page: 1)).to eq(
        [collection.collection_cards[1]],
      )
    end
  end

  describe '#collection_cards_by_row_and_col' do
    let!(:collection) { create(:collection, num_cards: 4, record_type: :collection) }
    let(:collection_cards) { collection.collection_cards }
    let!(:matching_cards) do
      collection_cards[0].update(row: 3, col: 5)
      collection_cards[1].update(row: 6, col: 5)
      [
        collection_cards[0],
        collection_cards[1],
      ]
    end
    let!(:non_matching_cards) do
      collection_cards[2].update(row: 2, col: 5)
      collection_cards[3].update(row: 11, col: 5)
    end

    it 'returns cards matching row and col' do
      expect(
        collection.collection_cards_by_row_and_col(
          rows: [3, 10],
          cols: [4, 6],
        ),
      ).to match_array(matching_cards)
    end
  end

  describe '#search_data' do
    let(:parent_collection) { nil }
    let(:collection) { create(:collection, parent_collection: parent_collection) }
    let(:users) { create_list(:user, 2) }
    let(:groups) { create_list(:group, 2) }

    before do
      users[0].add_role(Role::EDITOR, collection)
      users[1].add_role(Role::VIEWER, collection)
      groups[0].add_role(Role::EDITOR, collection)
      groups[1].add_role(Role::VIEWER, collection)
    end

    it 'includes all user_ids' do
      expect(collection.search_data[:user_ids]).to match_array(users.map(&:id))
    end

    it 'includes all group_ids' do
      expect(collection.search_data[:group_ids]).to match_array(groups.map(&:id))
    end

    it 'sets activity date to nil when no activity' do
      expect(collection.search_data[:activity_dates]).to be nil
    end

    it 'includes activity dates, without duplicates' do
      organization = create(:organization)
      user = create(:user)
      activity1 = collection.activities.create(actor: user, organization: organization)
      collection.activities.create(actor: user, organization: organization)
      activity3 = collection.activities.create(actor: user, organization: organization, updated_at: 1.week.from_now)
      expected_activity_dates = [activity1.updated_at.to_date, activity3.updated_at.to_date]
      expect(collection.search_data[:activity_dates]).to match_array(expected_activity_dates)
    end

    context 'with parent collection' do
      let!(:parent_collection) { create(:collection) }

      it 'includes parent collections' do
        expect(collection.search_data[:parent_ids]).to eq([parent_collection.id])
      end
    end
  end

  describe '#unarchive_cards!' do
    let(:collection) { create(:collection, num_cards: 3) }
    let(:cards) { collection.all_collection_cards }
    let(:snapshot) do
      {
        id: collection.id,
        attributes: {
          collection_cards_attributes: cards.map do |card|
            { id: card.id, order: 3, width: 2, height: 1 }
          end,
        },
      }
    end

    before do
      collection.archive!
      expect(cards.first.archived?).to be true
    end

    it 'unarchives all cards' do
      expect do
        collection.unarchive_cards!(cards, snapshot)
      end.to change(collection.collection_cards, :count).by(3)
      expect(cards.first.reload.active?).to be true
    end

    it 'applies snapshot to revert the state' do
      expect(cards.first.width).to eq 1 # default
      collection.unarchive_cards!(cards, snapshot)
      # pick up new attrs
      card = collection.reload.collection_cards.first
      expect(card.width).to eq 2
      # should always reorder the cards
      expect(card.order).to eq 0
    end

    context 'with a master template and existing instances' do
      let!(:instance) { create(:collection, template: collection) }
      before do
        collection.update(master_template: true)
      end

      it 'calls queue_update_template_instances' do
        expect(UpdateTemplateInstancesWorker).to receive(:perform_async)
        collection.unarchive_cards!(cards, snapshot)
      end
    end

    context 'with a board collection' do
      let(:collection) { create(:board_collection, num_cards: 3) }
      let(:cards) { collection.all_collection_cards.first(3) }
      let(:first_card) { cards.first }
      let(:overlap_card) { create(:collection_card_text, parent: collection, row: 1, col: 1) }

      before do
        first_card.update(row: 1, col: 1)
      end

      it 'calls the BoardPlacement service to place cards with collision detection' do
        allow(CollectionGrid::BoardPlacement).to receive(:call).and_call_original
        expect(CollectionGrid::BoardPlacement).to receive(:call).with(
          moving_cards: cards,
          to_collection: collection,
          row: cards.first.row,
          col: cards.first.col,
        )
        # create overlap card
        overlap_card
        collection.unarchive_cards!(cards, snapshot)
        # pick up new attrs
        first_card.reload
        expect(first_card.active?).to be true
        # should have bumped it out of the way by 1
        expect(first_card.col).to eq 2
      end
    end

    context 'with a master_template' do
      let(:collection) { create(:collection, master_template: true, num_cards: 3) }

      context 'with a template instance' do
        let!(:instance) { create(:collection, template: collection) }

        it 'should call the UpdateTemplateInstancesWorker' do
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
            collection.id,
            cards.pluck(:id),
            :unarchive,
          )
          collection.unarchive_cards!(cards, snapshot)
        end
      end

      context 'without a template instance' do
        it 'should not call the UpdateTemplateInstancesWorker' do
          expect(UpdateTemplateInstancesWorker).not_to receive(:perform_async)
          collection.unarchive_cards!(cards, snapshot)
        end
      end
    end
  end

  describe '#reset_permissions!' do
    let(:user) { create(:user) }
    let(:collection) { create(:collection, num_cards: 1, add_editors: [user]) }
    let!(:subcollection) { create(:collection, parent_collection: collection, add_viewers: [user]) }

    it 'resets all sub-items and collections to be anchored to the parent' do
      expect(subcollection.roles).not_to be_empty
      collection.reset_permissions!
      # update_all doesn't automatically reload the models so we need to
      collection.items.first.reload
      subcollection.reload
      expect(collection.items.first.roles_anchor_collection_id).to eq collection.id
      expect(collection.items.first.can_edit?(user)).to be true
      expect(subcollection.roles).to be_empty
      expect(subcollection.roles_anchor_collection_id).to eq collection.id
      expect(subcollection.can_edit?(user)).to be true
    end
  end

  describe '#submit_submission' do
    let(:submission_box) { create(:submission_box) }
    let(:submission) { create(:collection, :submission, parent_collection: submission_box.submissions_collection) }

    before do
      submission_box.setup_submissions_collection!
      submission.submission_attrs['hidden'] = true
      submission.save
    end

    it 'should unset the hidden attribute and merge roles from the SubmissionBox' do
      expect(Roles::MergeToChild).to receive(:call).with(
        parent: submission_box,
        child: submission,
      )
      submission.submit_submission!
      expect(submission.submission_attrs['hidden']).to be false
    end
  end

  describe 'child of a master template' do
    let(:parent) { create(:collection, master_template: true) }
    let(:child) { create(:collection, parent_collection: parent) }

    it 'should have a child_of_a_master_template = true' do
      expect(child.child_of_a_master_template?).to be true
    end
  end

  describe 'subtemplate instance' do
    let(:parent) { create(:collection, master_template: true) }
    let(:child) { create(:collection, master_template: true, parent_collection: parent) }
    let(:instance_of_parent) { create(:collection, template_id: parent.id) }
    let(:instance_of_child) { create(:collection, template_id: child.id) }

    it 'direct template instance should not be a subtemplate instance' do
      expect(instance_of_parent.templated?).to be true
      expect(parent.subtemplate?).to be false
      expect(instance_of_parent.subtemplate_instance?).to be false
    end

    it 'template instance of child should be a subtemplate instance' do
      expect(instance_of_child.templated?).to be true
      expect(child.subtemplate?).to be true
      expect(instance_of_child.subtemplate_instance?).to be true
    end
  end

  describe '#increment_card_orders_at' do
    let!(:collection) { create(:collection, num_cards: 3) }

    it 'should bump all card orders by the desired amount' do
      expect(collection.collection_cards.map(&:order)).to eq [0, 1, 2]
      collection.increment_card_orders_at(0)
      collection.reload
      expect(collection.collection_cards.map(&:order)).to eq [1, 2, 3]
      collection.increment_card_orders_at(2, amount: 4)
      collection.reload
      expect(collection.collection_cards.map(&:order)).to eq [1, 6, 7]
    end
  end

  describe '#card_order_at' do
    let!(:collection) { create(:collection, num_cards: 3) }

    it 'should convert "beginning/end" into the correct order' do
      expect(collection.card_order_at('beginning')).to eq 0
      expect(collection.card_order_at('end')).to eq 3
    end

    it 'should return the order if it\'s an integer' do
      expect(collection.card_order_at(2)).to eq 2
    end
  end

  describe '#reorder_cards!' do
    let!(:collection) { create(:collection, num_cards: 5) }
    let(:cards) { collection.collection_cards }

    it 'reorders with pinned and hidden in consideration' do
      expect(collection.all_collection_cards.order(order: :asc).pluck(:id, :order)).to eq([
        [cards[0].id, 0],
        [cards[1].id, 1],
        [cards[2].id, 2],
        [cards[3].id, 3],
        [cards[4].id, 4],
      ])

      cards[0].update(archived: true)
      cards[1].update(hidden: true)
      cards[2].update(order: 999)
      cards[3].update(pinned: true)
      collection.reorder_cards!
      expect(collection.reload.collection_cards.pluck(:id, :order)).to eq([
        # pinned
        [cards[3].id, 0],
        # normal order
        [cards[4].id, 1],
        # high order
        [cards[2].id, 2],
        # low order, hidden
        [cards[1].id, 3],
        # archived card not included
      ])
    end
  end

  # Caching methods
  context 'caching and stored attributes' do
    describe '#cache_key' do
      let(:user) { create(:user) }
      let(:collection) { create(:collection, num_cards: 2) }
      let(:first_card) { collection.collection_cards.first }

      it 'updates based on the collection updated_at timestamp' do
        expect do
          collection.update(updated_at: 10.seconds.from_now)
        end.to change(collection, :cache_key)
      end

      it 'updates when roles are updated' do
        expect do
          # this should "touch" the role updated_at
          user.add_role(Role::EDITOR, collection)
        end.to change(collection, :cache_key)
      end

      it 'updates when cards are updated' do
        expect do
          first_card.update(updated_at: 10.seconds.from_now)
        end.to change(collection, :cache_key)
      end

      it 'updates based on user_id' do
        logged_out_key = collection.cache_key('order', nil)
        logged_in_key = collection.cache_key('order', user.id)
        expect(logged_out_key).not_to eq logged_in_key
      end
    end

    describe '#cache_tag_list' do
      let(:tag_list) { %w[testing prototyping] }
      let(:collection) { create(:collection, tag_list: tag_list) }

      it 'caches tag_list onto cached_attributes' do
        expect(collection.cached_tag_list).to be nil
        collection.cache_tag_list
        expect(collection.cached_tag_list).to match_array(tag_list)
      end
    end

    describe '#cache_cover' do
      let(:collection) { create(:collection, num_cards: 3) }
      let!(:image_card) { create(:collection_card_image, parent: collection) }

      it 'caches cover onto cached_attributes' do
        expect(collection.cached_cover).to be nil
        collection.cache_cover
        expect(collection.cached_cover['text']).not_to be nil
        expect(collection.cached_cover['image_url']).not_to be nil
      end
    end

    describe '#update_cover_text!' do
      let(:collection) { create(:collection, num_cards: 3) }
      let(:item) { collection.collection_cards.first.item }

      before do
        collection.cache_cover!
      end

      it 'updates cached cover text to match item updates' do
        item.data_content = { ops: [{ insert: 'Howdy doody.' }] }
        collection.update_cover_text!(item)
        expect(collection.cached_cover['text']).to eq 'Howdy doody.'
      end
    end

    describe '#cache_card_count!' do
      let(:collection) { create(:collection, num_cards: 3) }

      it 'should calculate and not clobber other cached attrs' do
        expect(collection.cached_cover).to be nil
        collection.cache_cover!
        collection.cache_card_count!
        expect(collection.cached_card_count).to eq 3
        expect(collection.cached_cover).not_to be nil
        collection.update(submission_attrs: { submission: true })
        collection.cache_card_count!
        expect(collection.reload.submission?).to be true
      end
    end
    # <- end Caching methods
  end
end
