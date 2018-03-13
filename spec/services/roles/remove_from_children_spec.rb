require 'rails_helper'

RSpec.describe Roles::RemoveFromChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:remove_from_children) do
    Roles::RemoveFromChildren.new(parent: collection, roles: [role])
  end

  describe '#call' do
    let(:user) { create(:user) }
    let!(:role) { user.add_role(Role::EDITOR, collection) }

    before do
      collection.items.each { |i| user.add_role(Role::EDITOR, i) }
      user.add_role(Role::EDITOR, subcollection)
    end

    it 'should remove editor role from all card items' do
      expect(remove_from_children.call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(Role::EDITOR, i) }).to be false
    end

    it 'should remove editor role from sub-collection' do
      expect(remove_from_children.call).to be true
      user.reload
      expect(user.has_role?(Role::EDITOR, subcollection)).to be false
    end

    it 'should leave any other roles' do
      collection.items.each { |i| user.add_role(Role::VIEWER, i) }
      expect(remove_from_children.call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(Role::VIEWER, i) }).to be true
    end
  end
end
