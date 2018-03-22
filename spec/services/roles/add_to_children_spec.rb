require 'rails_helper'

RSpec.describe Roles::AddToChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:users) { [user] }
  let(:add_to_children) do
    Roles::AddToChildren.new(users_to_add: users, parent: collection, role_name: role_name)
  end

  describe '#call' do
    let(:user) { create(:user) }
    let(:role_name) { Role::EDITOR }

    it 'should create new roles for each item' do
      expect { add_to_children.call }.to change(UsersRole, :count).by(6)
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
      let!(:new_users) { create_list(:user, 3) }
      let(:users) { new_users + [user] }

      before do
        users.each { |u| u.add_role(Role::EDITOR, collection) }
      end

      it 'should include all users from parent' do
        expect(add_to_children.call).to be true
        expect(collection.items.first.editors).to match_array(users)
      end
    end
  end
end
