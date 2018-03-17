require 'rails_helper'

describe Resourceable, type: :concern do
  let(:user) { create(:user) }
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
      expect(collection.viewers).to be_empty
      expect(collection.viewer_ids).to be_empty
    end

    context 'when assigning role' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'returns users assigned' do
        expect(collection.editors).to match_array([user])
        expect(collection.editor_ids).to match_array([user.id])
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
    it 'return false' do
      expect(collection.can_view?(user)).to be false
    end

    context 'as viewer' do
      before do
        user.add_role(Role::VIEWER, collection)
      end

      it 'returns true' do
        expect(collection.can_view?(user)).to be true
      end
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'returns true' do
        expect(collection.can_view?(user)).to be true
      end
    end
  end
end
