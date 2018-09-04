require 'rails_helper'

RSpec.describe CollectionPermissionResetter, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, num_cards: 5, organization: organization) }
  let(:items) { collection.items }
  let!(:subcollection) do
    create(:collection, num_cards: 5, organization: organization, parent_collection: collection)
  end
  let(:user) { create(:user) }
  let(:user2) { create(:user) }

  describe '#call' do
    let(:builder) do
      CollectionPermissionResetter.new(collection: collection)
    end

    before do
      user.add_role(Role::EDITOR, collection)
      user2.add_role(Role::VIEWER, collection)
    end

    it 'should assign the same permissions on the collection to all the children' do
      expect(items.all? { |i| i.can_edit?(user) }).to be false
      expect(items.all? { |i| i.can_view?(user2) }).to be false
      builder.call
      user.reset_cached_roles!
      user2.reset_cached_roles!
      expect(items.all? { |i| i.can_edit?(user) }).to be true
      expect(items.all? { |i| i.can_view?(user2) }).to be true
      expect(subcollection.items.all? { |i| i.can_edit?(user) }).to be true
      expect(subcollection.items.all? { |i| i.can_view?(user2) }).to be true
    end
  end
end
