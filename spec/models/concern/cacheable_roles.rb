require 'rails_helper'

describe CacheableRoles, type: :concern do
  let(:collection) { create(:collection) }
  let(:user) { create(:user) }

  it 'should have concern included' do
    expect(User.ancestors).to include(CacheableRoles)
  end

  describe 'callbacks' do
    describe '#clear_cached_roles' do
      it 'should reset has_role_by_identifier? after add_role' do
        expect {
          user.add_role(Role::EDITOR, collection)
        }.to change {
          user.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
        }.from(false).to(true)
      end

      it 'should reset has_role_by_identifier? after remove_role' do
        user.add_role(Role::EDITOR, collection)
        expect {
          user.remove_role(Role::EDITOR, collection)
        }.to change {
          user.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
        }.from(true).to(false)
      end
    end
  end

  describe '#has_role_by_identifier?' do
    let(:has_editor_role) do
      user.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
    end

    it 'returns true if user has role' do
      user.add_role(Role::EDITOR, collection)
      expect(has_editor_role).to be true
    end

    it 'returns false if user does not have role' do
      expect(has_editor_role).to be false
    end
  end
end
