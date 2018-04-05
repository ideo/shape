require 'rails_helper'

describe Collection, type: :model do
  context 'validations' do
    it { should validate_presence_of(:organization) }
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
    let!(:collection) { create(:collection, num_cards: 5, tag_list: %w[Prototype Other]) }
    let(:copy_parent_card) { false }
    let(:duplicate) do
      dupe = collection.duplicate!(
        for_user: user,
        copy_parent_card: copy_parent_card,
      )
      # Necessary because AR-relationship is cached
      user.roles.reload
      user.reset_cached_roles!
      dupe
    end

    before do
      user.add_role(Role::EDITOR, collection)
      collection.items.each do |item|
        user.add_role(Role::EDITOR, item)
      end
    end

    it 'clones the collection' do
      expect { duplicate }.to change(Collection, :count).by(1)
      expect(collection.id).not_to eq(duplicate.id)
    end

    it 'references the current collection as cloned_from' do
      expect(duplicate.cloned_from).to eq(collection)
    end

    it 'clones all the collection cards' do
      expect(duplicate.collection_cards.size).to eq(5)
      expect(collection.collection_cards.map(&:id)).not_to match_array(duplicate.collection_cards.map(&:id))
    end

    it 'clones all items' do
      expect(duplicate.items.size).to eq(5)
      expect(collection.items.map(&:id)).not_to match_array(duplicate.items.map(&:id))
    end

    it 'clones all roles on collection' do
      expect(duplicate.roles.map(&:name)).to match(collection.roles.map(&:name))
      expect(duplicate.can_edit?(user)).to be true
    end

    it 'clones all roles on items' do
      expect(duplicate.items.all? { |item| item.can_edit?(user) }).to be true
    end

    it 'clones tag list' do
      expect(duplicate.tag_list).to match_array collection.tag_list
    end

    context 'with items you can\'t see' do
      let!(:hidden_item) { collection.items.first }
      let!(:viewable_items) { collection.items - [hidden_item] }

      before do
        user.remove_role(Role::EDITOR, hidden_item)
      end

      it 'duplicates collection' do
        expect { duplicate }.to change(Collection, :count).by(1)
      end

      it 'duplicates all viewable items' do
        # Use cloned_from to get original items
        expect(duplicate.items.map(&:cloned_from)).to match_array(viewable_items)
        expect(duplicate.items(&:cloned_from)).not_to include(hidden_item)
      end
    end

    context 'with parent collection card' do
      let!(:parent_collection_card) do
        create(:collection_card_collection, collection: collection)
      end

      it 'does not duplicate if no flag passed' do
        expect(duplicate.parent_collection_card).to be_nil
      end

      context 'with copy_parent_card true' do
        let!(:copy_parent_card) { true }

        it 'duplicates parent' do
          expect(duplicate.id).not_to eq(collection.parent_collection_card.id)
        end

        it 'increases the order by 1' do
          expect(duplicate.parent_collection_card.order).to eq(collection.parent_collection_card.order + 1)
        end
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
end
