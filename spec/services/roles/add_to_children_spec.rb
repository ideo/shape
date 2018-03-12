require 'rails_helper'

RSpec.describe Roles::AddToChildren, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let(:user) { create(:user) }
  let!(:role) { user.add_role(:editor, collection) }
  let(:add_to_children) do
    Roles::AddToChildren.new(object: collection, role: role)
  end

  describe '#call' do
    it 'should add editor role to all card items' do
      expect(add_to_children.call).to be true
      user.reload
      expect(collection.items.all? { |i| user.has_role?(:editor, i) }).to be true
    end

    context 'with sub-collection' do
      let(:subcollection) { create(:collection) }
      let!(:subcollection) do
        create(:collection_card_collection, collection: collection)
      end

      it 'should add editor role to sub-collection' do
        expect(add_to_children.call).to be true
        expect(user.has_role?(:editor, subcollection)).to be true
      end
    end
  end
end
