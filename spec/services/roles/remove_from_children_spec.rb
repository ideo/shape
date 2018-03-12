require 'rails_helper'

RSpec.describe Roles::RemoveFromChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let(:user) { create(:user) }
  let!(:role) { user.add_role(Role::EDITOR, collection) }

  describe '#call' do
    before do
      collection.items.each { |i| user.add_role(Role::EDITOR, i) }
    end

    it 'should remove editor role from all card items' do
      expect(Roles::RemoveFromChildren.new(object: collection, roles: [role]).call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(Role::EDITOR, i) }).to be false
    end

    it 'should leave any other roles' do
      collection.items.each { |i| user.add_role(Role::VIEWER, i) }
      expect(Roles::RemoveFromChildren.new(object: collection, roles: [role]).call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(Role::VIEWER, i) }).to be true
    end

    context 'with sub-collection' do
      let!(:subcollection_card) do
        create(:collection_card_collection, parent: collection)
      end
      let(:subcollection) { subcollection_card.collection }

      before do
        user.add_role(Role::EDITOR, subcollection)
      end

      it 'should remove editor role from sub-collection' do
        expect(collection.children).to include(subcollection)
        expect(Roles::RemoveFromChildren.new(object: collection, roles: [role]).call).to be true
        expect(user.has_role?(:editor, subcollection)).to be false
      end
    end
  end
end
