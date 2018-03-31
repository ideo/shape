require 'rails_helper'

describe Resourceable, type: :concern do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let(:collection) { create(:collection) }

  it 'should have concern included' do
    expect(Collection.ancestors).to include(Resourceable)
  end

  describe '#dynamic_role_names' do
    # Note: these will fail if we ever change role names... so it's a bit brittle
    it 'defines given roles' do
      expect(collection.respond_to?(:editors)).to be true
      expect(collection.respond_to?(:viewers)).to be true
    end

    it 'returns nothing when unassigned' do
      expect(collection.viewers[:users]).to be_empty
      expect(collection.viewers[:groups]).to be_empty
    end

    context 'when assigning roles' do
      before do
        user.add_role(Role::EDITOR, collection)
        group.add_role(Role::EDITOR, collection)
      end

      it 'returns users assigned' do
        expect(collection.editors[:users]).to match_array([user])
      end

      it 'returns groups assigned' do
        expect(collection.editors[:groups]).to match_array([group])
      end
    end
  end

  describe '#can_edit?' do
    it 'return false' do
      expect(collection.can_edit?(user)).to be false
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'returns true' do
        expect(collection.can_edit?(user)).to be true
      end
    end
  end

  describe '#can_view?' do
    it 'return false for user' do
      expect(collection.can_view?(user)).to be false
    end

    it 'return false for group' do
      expect(collection.can_view?(group)).to be false
    end

    context 'as viewer' do
      before do
        user.add_role(Role::VIEWER, collection)
        group.add_role(Role::VIEWER, collection)
      end

      it 'returns true for user' do
        expect(collection.can_view?(user)).to be true
      end

      it 'returns true for group' do
        expect(collection.can_view?(group)).to be true
      end
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
        group.add_role(Role::EDITOR, collection)
      end

      it 'returns true for user' do
        expect(collection.can_view?(user)).to be true
      end

      it 'returns true for group' do
        expect(collection.can_view?(group)).to be true
      end
    end
  end
end
