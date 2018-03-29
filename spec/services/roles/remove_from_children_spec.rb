require 'rails_helper'

RSpec.describe Roles::RemoveFromChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:users) { [] }
  let(:groups) { [] }
  let(:role_name) { Role::EDITOR }
  let(:remove_from_children) do
    Roles::RemoveFromChildren.new(
      parent: collection,
      role_name: role_name,
      users: users,
      groups: groups,
    )
  end

  describe '#call' do
    let(:user) { create(:user) }
    let(:user_2) { create(:user) }
    let!(:role) { user.add_role(role_name, collection) }
    let!(:users) { [user] }

    before do
      collection.items.each { |i| user.add_role(role_name, i) }
      user.add_role(role_name, subcollection)
    end

    it 'should remove editor role from all card items' do
      expect(remove_from_children.call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(role_name, i) }).to be false
    end

    it 'should remove editor role from sub-collection' do
      expect(remove_from_children.call).to be true
      user.reload
      expect(user.has_role?(role_name, subcollection)).to be false
    end

    context 'if user has other roles on object' do
      before do
        collection.items.each { |i| user.add_role(Role::VIEWER, i) }
      end

      it 'should leave any other roles from same user' do
        expect(remove_from_children.call).to be true
        user.reload
        expect(collection.items.all? { |i| user.has_role?(Role::VIEWER, i) }).to be true
      end
    end

    context 'with another user that has the same role' do
      before do
        collection.items.each { |i| user_2.add_role(role_name, i) }
      end

      it 'should leave any other roles from a different user' do
        expect(remove_from_children.call).to be true
        user_2.reload
        expect(collection.items.all? { |i| user_2.has_role?(role_name, i) }).to be true
      end
    end

    context 'if user did not have role' do
      let!(:role_name) { Role::VIEWER }

      it 'should not fail if user did not have role' do
        expect(remove_from_children.call).to be true
      end
    end
  end
end
