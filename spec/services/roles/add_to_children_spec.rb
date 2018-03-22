require 'rails_helper'

RSpec.describe Roles::AddToChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:add_to_children) do
    Roles::AddToChildren.new(parent: collection, new_roles: [role])
  end

  describe '#call' do
    let(:user) { create(:user) }
    let!(:role) { user.add_role(Role::EDITOR, collection) }

    it 'should create new roles for each item' do
      expect { add_to_children.call }.to change(Role, :count).by(6)
    end

    it 'should add editor role to all card items' do
      expect(add_to_children.call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(:editor, i) }).to be true
    end

    context 'with sub-collection' do
      let!(:subcollection_card) do
        create(:collection_card_collection, parent: collection)
      end
      let(:subcollection) { subcollection_card.collection }

      it 'should add editor role to sub-collection' do
        expect(collection.children).to include(subcollection)
        expect(add_to_children.call).to be true
        expect(user.has_role?(:editor, subcollection)).to be true
      end
    end

    context 'with multiple users' do
      let!(:users) { create_list(:user, 3) }

      before do
        users.each { |u| u.add_role(Role::EDITOR, collection) }
      end

      it 'should include all users from parent' do
        expect(add_to_children.call).to be true
        expect(collection.items.first.editors).to match_array([user] + users)
      end
    end
  end
end
