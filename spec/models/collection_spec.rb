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
    # these come from Testable concern
    it { should have_many :test_collections }
    it { should have_one :live_test_collection }

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
    # organization: nil == allow organization to inherit
    let(:collection) { create(:collection, organization: organization) }

    context 'if parent is user collection' do
      let(:parent_collection) do
        create(:user_collection, organization: organization)
      end

      it 'does give view access' do
        expect(collection.enable_org_view_access_if_allowed(parent_collection)).to be true
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
          expect(collection.enable_org_view_access_if_allowed(parent_collection)).to be false
          expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
        end
      end
    end

    context 'if parent is not user collection' do
      let(:parent_collection) { create(:collection, organization: organization) }

      it 'does not give view access to its organization\'s primary group' do
        expect(collection.enable_org_view_access_if_allowed(parent_collection)).to be false
        expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
      end
    end
  end

  describe '#duplicate' do
    let!(:user) { create(:user) }
    let!(:parent_collection_user) { create(:user) }
    let!(:collection_user) { create(:user) }
    let!(:parent_collection) { create(:collection) }
    let!(:collection) { create(:collection, num_cards: 3, tag_list: %w[Prototype Other]) }
    let!(:parent_collection_card) do
      create(:collection_card_collection, parent: parent_collection, collection: collection)
    end
    let(:copy_parent_card) { false }
    let(:parent) { collection.parent }
    let(:duplicate) do
      dupe = collection.duplicate!(
        for_user: user,
        copy_parent_card: copy_parent_card,
        parent: parent,
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

    context 'without user' do
      let(:duplicate_without_user) do
        dupe = collection.duplicate!(
          copy_parent_card: true,
          parent: parent,
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
          collection.collection_cards.map(&:id),
          instance_of(Integer),
          nil,
          true,
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

      it 'duplicates parent' do
        expect(duplicate.id).not_to eq(collection.parent_collection_card.id)
      end

      it 'creates duplicate with parent_collection as its parent' do
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
          collection.collection_cards.map(&:id),
          instance_of(Integer),
          user.id,
          true,
        )
        collection.duplicate!(for_user: user)
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

    context 'with viewer role' do
      before do
        user.add_role(Role::VIEWER, collection)
      end

      it 'upgrades viewer user to editor role upon duplication' do
        expect(collection.can_edit?(user)).to be false
        # roles shouldn't match because we're removing Viewer and replacing w/ Editor
        expect(duplicate.roles.map(&:name)).not_to match(collection.roles.map(&:name))
        expect(duplicate.can_edit?(user)).to be true
      end
    end

    context 'with system_collection set to true' do
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
          anything,
          anything,
          anything,
          true,
        )
        collection.duplicate!(for_user: user, system_collection: true)
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
      collection.update(tag_list: %w[this that])
      expect(collection.reload.all_tag_names).to match_array %w[this that]
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
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
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
      expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards)
    end

    context 'if one item is private' do
      let(:private_card) { cards[0] }

      before do
        user.remove_role(Role::VIEWER, private_card.record)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(cards, user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards - [private_card])
      end
    end

    context 'if one subcollection is private' do
      let(:private_card) { subcollection_card }

      before do
        user.remove_role(Role::VIEWER, subcollection_card.collection)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(cards, user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards - [private_card])
      end
    end

    context 'with card_order param' do
      it 'should return results according to the updated_at param' do
        viewable = collection.collection_cards_viewable_by(cards, user, card_order: 'updated_at')
        expect(viewable.first).to eq(cards.sort_by(&:updated_at).reverse.first)
        expect(viewable.last).to eq(cards.sort_by(&:updated_at).first)
      end

      it 'should return results according to the cached_test_scores sorting param' do
        scored1 = collection.collections.first
        scored1.update(cached_test_scores: { 'question_useful' => 30 })
        scored2 = collection.collections.last
        scored2.update(cached_test_scores: { 'question_useful' => 20 })

        viewable = collection.collection_cards_viewable_by(cards, user, card_order: 'question_useful')
        expect(viewable.first).to eq(scored1.parent_collection_card)
        expect(viewable.second).to eq(scored2.parent_collection_card)
      end
    end
  end

  describe '#search_data' do
    let(:collection) { create(:collection) }
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
      cards.first.reload
      expect(cards.first.width).to eq 2
      # should always reorder the cards
      expect(cards.first.order).to eq 0
    end

    context 'with a master_template' do
      let(:collection) { create(:collection, master_template: true, num_cards: 3) }

      it 'should call the UpdateTemplateInstancesWorker' do
        expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(collection.id)
        collection.unarchive_cards!(cards, snapshot)
      end
    end
  end

  describe '#update_processing_status' do
    let(:collection) { create(:collection) }

    context 'processing = :duplicating' do
      let(:processing) { true }

      it 'marks collections as duplicating' do
        expect(collection.duplicating?).to be false
        collection.update_processing_status(Collection.processing_statuses[:duplicating])
        expect(collection.duplicating?).to be true
      end
    end

    context 'processing = nil' do
      let(:processing) { false }

      before do
        collection.update_attributes(
          processing_status: Collection.processing_statuses[:duplicating],
        )
      end

      it 'marks collection as not processing' do
        expect(collection.duplicating?).to be true
        collection.update_processing_status(nil)
        expect(collection.duplicating?).to be false
      end

      it 'broadcasts processing has stopped' do
        expect(collection).to receive(:processing_done).once
        collection.update_processing_status(nil)
      end
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
        item.text_data = { ops: [{ insert: 'Howdy doody.' }] }
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
      end
    end
    # <- end Caching methods
  end
end
