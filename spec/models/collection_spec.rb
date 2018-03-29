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
    it { should have_many :reference_collection_cards }
    it { should have_many :items }
    it { should have_many :collections }
    it { should have_one :parent_collection_card }
    it { should belong_to :cloned_from }
    it { should belong_to :organization }
  end

  describe '#inherit_parent_organization_id' do
    let!(:parent_collection) { create(:user_collection) }
    let!(:collection_card) { create(:collection_card, parent: parent_collection) }
    let!(:collection) { create(:collection, name: 'New Collection', organization: nil, collection_cards: [collection_card]) }

    it 'inherits organization id from parent collection' do
      expect(collection.organization_id).to eq(parent_collection.organization_id)
    end
  end

  describe '#duplicate' do
    let!(:user) { create(:user) }
    let!(:collection) { create(:collection, num_cards: 5) }
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
end
