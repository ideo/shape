require 'rails_helper'

describe RolifyExtensions, type: :concern do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection) }
  let(:user) { create(:user) }

  before do
    user.add_role(Role::MEMBER, organization.primary_group)
  end

  it 'should have concern included' do
    expect(User.ancestors).to include(RolifyExtensions)
  end

  describe 'callbacks' do
    describe '#clear_cached_roles' do
      it 'should reset has_role_by_identifier? after add_role' do
        expect {
          user.add_role(Role::EDITOR, collection)
        }.to change {
          user.reload.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
        }.from(false).to(true)
      end

      it 'should reset has_role_by_identifier? after remove_role' do
        user.add_role(Role::EDITOR, collection)
        expect {
          user.remove_role(Role::EDITOR, collection)
        }.to change {
          user.reload.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
        }.from(true).to(false)
      end
    end
  end

  describe '#has_role_by_identifier?' do
    let(:has_editor_role) do
      user.has_role_by_identifier?(Role::EDITOR, collection.resource_identifier)
    end
    let(:has_viewer_role) do
      user.has_role_by_identifier?(Role::VIEWER, collection.resource_identifier)
    end

    it 'returns true if user has role' do
      user.add_role(Role::EDITOR, collection)
      expect(has_editor_role).to be true
    end

    it 'returns false if user does not have role' do
      expect(has_editor_role).to be false
    end

    context 'with group' do
      let!(:group) { create(:group, organization: organization) }

      before do
        user.add_role(Role::MEMBER, group)
      end

      it 'returns false if group does not have role' do
        expect(has_editor_role).to be false
        expect(has_viewer_role).to be false
      end

      it 'returns true if user has role through group' do
        group.add_role(Role::VIEWER, collection)
        expect(has_viewer_role).to be true
        expect(has_editor_role).to be false
      end

      it 'returns true if user has role through group' do
        group.add_role(Role::EDITOR, collection)
        expect(has_editor_role).to be true
        expect(has_viewer_role).to be false
      end
    end
  end
end
