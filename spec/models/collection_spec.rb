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

    describe '#collection_cards' do
      let!(:collection) { create(:collection, num_cards: 5) }
      let(:collection_cards) { collection.collection_cards }

      it 'should find collection cards in order of order: :asc' do
        expect(collection_cards.sort_by(&:order)).to match_array(collection_cards)
      end

      it 'should only find active collection cards' do
        expect {
          collection_cards.first.archive!
        }.to change(collection.collection_cards, :count).by(-1)
      end

      describe '#touch_related_cards' do
        let!(:collection) { create(:collection) }
        let!(:card_linked_to_this_collection) { create(:collection_card_link, collection: collection) }

        it 'should update linked cards if updated_at changed' do
          expect {
            collection.update(updated_at: Time.now) && card_linked_to_this_collection.reload
          }.to change(card_linked_to_this_collection, :updated_at)
        end
        it 'should update linked cards after update' do
          expect {
            collection.update(name: 'Bobo') && card_linked_to_this_collection.reload
          }.to change(card_linked_to_this_collection, :updated_at)
        end
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

  describe '#allow_primary_group_view_access' do
    let!(:organization) { create(:organization) }
    let!(:user_collection) { create(:user_collection, organization: organization) }
    let!(:collection_card) { create(:collection_card, parent: user_collection) }
    let(:collection) { create(:collection, organization: nil, parent_collection_card: collection_card) }
    let!(:new_collection_card) { create(:collection_card_collection, parent: collection) }
    let(:new_collection) { new_collection_card.collection }

    before do
      collection.allow_primary_group_view_access
      new_collection.allow_primary_group_view_access
    end

    it 'gives view access to its organization\'s primary group if created in a UserCollection' do
      expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be true
    end

    it 'does not give view access to primary group if created in a different collection' do
      expect(organization.primary_group.has_role?(Role::VIEWER, new_collection)).to be false
    end
  end

  describe '#duplicate' do
    let!(:user) { create(:user) }
    let!(:parent_collection_user) { create(:user) }
    let!(:collection_user) { create(:user) }
    let!(:parent_collection) { create(:collection) }
    let!(:collection) { create(:collection, num_cards: 5, tag_list: %w[Prototype Other]) }
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
        expect(CollectionCardDuplicationWorker).to receive(:perform_async)
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
    let!(:collection) { create(:collection, num_cards: 3) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let(:cards) { collection.collection_cards }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::VIEWER, collection)
      collection.items.each do |item|
        user.add_role(Role::VIEWER, item)
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

  describe '#org_templates?' do
    let!(:user) { create(:user) }
    let!(:organization) { create(:organization) }
    let!(:collection) { organization.setup_templates(user) }

    it 'should be true if its org template collection id is itself' do
      expect(collection.org_templates?).to be true
    end
  end

  context 'caching and stored attributes' do
    describe '#recalculate_child_breadcrumbs_async' do
      let(:collection) { create(:collection) }

      it 'queues up BreadcrumbRecalculationWorker on name change' do
        expect(BreadcrumbRecalculationWorker).to receive(:perform_async)
        collection.update(name: 'New name')
      end

      it 'does not queue up BreadcrumbRecalculationWorker unless name change' do
        expect(BreadcrumbRecalculationWorker).not_to receive(:perform_async)
        collection.update(updated_at: Time.now)
      end
    end

    describe '#cache_key' do
      let(:user) { create(:user) }
      let(:collection) { create(:collection, num_cards: 2) }
      let(:first_card) { collection.collection_cards.first }

      it 'updates based on the collection updated_at timestamp' do
        expect {
          collection.update(updated_at: 10.seconds.from_now)
        }.to change(collection, :cache_key)
      end

      it 'updates when roles are updated' do
        expect {
          # this should "touch" the role updated_at
          user.add_role(Role::EDITOR, collection)
        }.to change(collection, :cache_key)
      end

      it 'updates when cards are updated' do
        expect {
          first_card.update(updated_at: 10.seconds.from_now)
        }.to change(collection, :cache_key)
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
  end
end
