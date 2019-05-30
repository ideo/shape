require 'rails_helper'

RSpec.describe Breadcrumb::ForUser, type: :service do
  let!(:collection) { create(:collection) }
  let(:organization) { collection.organization }
  let(:user) { create(:user, current_organization: organization) }
  let!(:subcollection) { create(:collection, num_cards: 1, organization: organization) }
  let!(:item) { subcollection.items.first }
  let(:collection_breadcrumb) do
    # Use .last to only get last item in breadcrumb
    Breadcrumb::Builder.new(collection).call.last
  end
  let(:subcollection_breadcrumb) do
    Breadcrumb::Builder.new(subcollection).call.last
  end
  let(:item_breadcrumb) do
    Breadcrumb::Builder.new(item).call.last
  end

  before do
    collection.primary_collection_cards.create!(
      collection: subcollection,
    )
    collection.recalculate_breadcrumb!
    subcollection.recalculate_breadcrumb!
    item.recalculate_breadcrumb!
  end

  describe '#viewable' do
    it 'returns empty breadcrumb if user has no access' do
      expect(Breadcrumb::ForUser.new(item, user).viewable).to eq([])
    end

    context 'with super admin access' do
      before do
        user.add_role(:super_admin)
      end

      it 'should return full breadcrumb' do
        expect(Breadcrumb::ForUser.new(item, user).viewable).to match_array([
          collection.id,
          subcollection.id,
        ])
      end
    end

    context 'with full access to parents' do
      before do
        user.add_role(Role::VIEWER, collection)
      end

      it 'should return full breadcrumb' do
        expect(Breadcrumb::ForUser.new(item, user).viewable).to match_array([
          collection.id,
          subcollection.id,
        ])
      end
    end

    context 'with edit access to parents' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'should return full breadcrumb' do
        expect(Breadcrumb::ForUser.new(item, user).viewable).to match_array([
          collection.id,
          subcollection.id,
        ])
      end
    end

    context 'with access to only direct ancestor' do
      before do
        subcollection.unanchor!
        user.add_role(Role::VIEWER, subcollection)
      end

      it 'should return breadcrumb with direct ancestor and item' do
        expect(Breadcrumb::ForUser.new(item, user).viewable).to match_array([
          subcollection.id,
        ])
      end
    end

    context 'with access only to item' do
      before do
        user.add_role(Role::VIEWER, item.becomes(Item))
      end

      it 'should return breadcrumb with only item' do
        expect(Breadcrumb::ForUser.new(item, user).viewable).to be_empty
      end
    end

    context 'with common_viewable collection in other orgs' do
      let!(:other_collection) { create(:collection) }
      let!(:common_viewable) { create(:collection, parent_collection: other_collection, common_viewable: true) }
      let!(:common_viewable_item) { create(:text_item, parent_collection: common_viewable, roles_anchor_collection: common_viewable) }

      before do
        common_viewable.unanchor!
      end

      it 'should return just the common_viewable collections' do
        expect(Breadcrumb::ForUser.new(common_viewable_item, user).viewable).to match_array([
          common_viewable.id,
        ])
      end
    end
  end

  describe '#viewable_to_api' do
    before do
      user.add_role(Role::VIEWER, collection)
    end

    it 'should have full length breadcrumb' do
      expect(Breadcrumb::ForUser.new(item, user).viewable_to_api.size).to eq(3)
    end

    it 'should have pluralize, underscored items' do
      breadcrumb = Breadcrumb::ForUser.new(item, user).viewable_to_api
      expect(breadcrumb.first[:type]).to eq('collections')
      expect(breadcrumb.last[:type]).to eq('items')
    end
  end
end
