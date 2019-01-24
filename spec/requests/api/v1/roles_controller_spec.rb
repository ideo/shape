require 'rails_helper'

describe Api::V1::RolesController, type: :request, json: true, auth: true do
  let(:user) { @user }
  let(:instance_double) { double('Roles') }

  before do
    allow(Roles::MassRemove).to receive(:new).and_return(instance_double)
    allow(Roles::MassAssign).to receive(:new).and_return(instance_double)
    allow(instance_double).to receive(:call).and_return(true)
  end

  describe 'GET #index' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let(:editor) { user }
    let!(:viewer) { create(:user) }
    let(:path) { "/api/v1/collections/#{collection.id}/roles" }
    let(:users_json) { json_included_objects_of_type('users') }

    before do
      viewer.add_role(Role::VIEWER, collection)
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches Role schema' do
      get(path)
      expect(json['data'].first['attributes']).to match_json_schema('role')
    end

    it 'includes users' do
      get(path)
      expect(users_json.size).to eq(2)
      expect(users_json.map { |u| u['id'].to_i }).to match_array([editor.id, viewer.id])
    end
  end

  describe 'POST #create' do
    let(:organization) { create(:organization) }
    let(:users) { create_list(:user, 3) }
    let(:user_ids) { users.map(&:id) }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:role_name) { 'editor' }
    let(:params) {
      {
        'role': { 'name': role_name },
        'user_ids': user_ids,
        'is_switching': false,
      }.to_json
    }

    context 'on a collection' do
      let!(:collection) { create(:collection, organization: organization, add_editors: [user]) }
      let(:path) { "/api/v1/collections/#{collection.id}/roles" }

      it 'returns a 204 no_content' do
        post(path, params: params)
        expect(response.status).to eq(204)
      end

      it 'adds role to users' do
        expect(Roles::MassAssign).to receive(:new).with(
          hash_including(
            object: collection,
            users: users,
            role_name: Role::EDITOR.to_s,
            propagate_to_children: true,
            new_role: true,
            invited_by: user,
          ),
        )
        post(path, params: params)
      end
    end

    context 'on an item' do
      let!(:item) { create(:text_item, add_editors: [user]) }
      # item also needs a collection w/ an org in order to assign permissions
      let!(:collection) { create(:collection, organization: organization) }
      let!(:collection_card) { create(:collection_card, item: item, parent: collection) }
      let(:path) { "/api/v1/items/#{item.id}/roles" }

      it 'returns a 204 no_content' do
        post(path, params: params)
        expect(response.status).to eq(204)
      end

      it 'adds role to users' do
        expect(Roles::MassAssign).to receive(:new).with(
          hash_including(
            object: item,
            users: users,
            role_name: Role::EDITOR.to_s,
            propagate_to_children: true,
            new_role: true,
            invited_by: user,
          ),
        )
        post(path, params: params)
      end
    end

    context 'on a group' do
      let!(:group) { create(:group, organization: organization, add_admins: [user]) }
      let(:path) { "/api/v1/groups/#{group.id}/roles" }
      let!(:role_name) { 'member' }

      it 'returns a 204 no_content' do
        post(path, params: params)
        expect(response.status).to eq(204)
      end

      it 'adds role to users' do
        expect(Roles::MassAssign).to receive(:new).with(
          hash_including(
            object: group,
            users: users,
            role_name: role_name,
            new_role: true,
            invited_by: user,
          ),
        )
        post(path, params: params)
      end
    end
  end

  describe 'DELETE #destroy', create_org: true do
    # Note: it's important that the group be in the user's current org,
    # or else the API won't give access to it
    let(:organization) { user.current_organization }
    let(:editor) { user }
    let!(:group) { create(:group, organization: organization) }
    let!(:viewers) { create_list(:user, 2, add_to_org: organization) }
    let(:num_cards) { 0 }
    let(:params) { { 'is_switching': false }.to_json }
    let!(:collection) do
      create(:collection,
             num_cards: num_cards,
             add_editors: [editor],
             add_viewers: (viewers + [group]))
    end

    context 'for a user' do
      let(:remove_viewer) { viewers.first }
      let(:params) do
        {
          role: { name: 'viewer' },
          user_ids: [remove_viewer.id],
          is_switching: false,
        }.to_json
      end
      let(:role) { collection.roles.find_by(name: Role::VIEWER) }
      let(:path) { "/api/v1/collections/#{collection.id}/roles/#{role.id}" }

      it 'returns a 204 no_content' do
        delete(path, params: params)
        expect(response.status).to eq(204)
      end

      context 'with cards/children' do
        it 'removes roles' do
          expect(Roles::MassRemove).to receive(:new).with(
            hash_including(
              object: collection,
              role_name: Role::VIEWER.to_s,
              propagate_to_children: true,
              fully_remove: true,
            ),
          )
          delete(path, params: params)
        end
      end

      context 'as viewer', auth: false, create_org: false do
        # Needs org and editor created because auth is false
        let!(:organization) { create(:organization) }
        let!(:editor) { create(:user, add_to_org: organization) }

        before do
          collection.update(organization: organization)
          log_in_as_user(remove_viewer)
        end

        context 'trying to remove someone else' do
          let(:params) do
            {
              role: { name: 'viewer' },
              user_ids: [viewers.last.id],
              is_switching: false,
            }.to_json
          end

          it 'returns 401' do
            delete(path, params: params)
            expect(response.status).to eq(401)
          end
        end

        context 'trying to remove yourself' do
          it 'returns a 204 no_content' do
            delete(path, params: params)
            expect(response.status).to eq(204)
          end

          it 'removes yourself' do
            expect(Roles::MassRemove).to receive(:new).with(
              hash_including(
                object: collection,
                role_name: Role::VIEWER.to_s,
                propagate_to_children: true,
                removed_by: remove_viewer,
                fully_remove: true,
              ),
            )
            delete(path, params: params)
          end
        end
      end
    end

    context 'for a group' do
      let!(:collection) do
        create(:collection,
               num_cards: num_cards,
               add_editors: [group],
               add_viewers: viewers)
      end
      let(:params) do
        {
          role: { name: 'editor' },
          group_ids: [group.id],
          is_switching: false,
        }.to_json
      end
      let(:role) { collection.roles.find_by(name: Role::EDITOR) }
      let(:path) { "/api/v1/collections/#{collection.id}/roles/#{role.id}" }

      before do
        editor.add_role(Role::ADMIN, group)
      end

      it 'returns a 204 no_content' do
        delete(path, params: params)
        expect(response.status).to eq(204)
      end

      context 'with cards/children' do
        it 'removes roles' do
          expect(Roles::MassRemove).to receive(:new).with(
            hash_including(
              object: collection,
              role_name: Role::EDITOR.to_s,
              propagate_to_children: true,
              fully_remove: true,
            ),
          )
          delete(path, params: params)
        end
      end

      context 'user is not group member/admin' do
        before do
          editor.remove_role(Role::ADMIN, group)
          editor.reload
        end

        it 'returns a 401' do
          delete(path, params: params)
          expect(response.status).to eq(401)
        end
      end
    end
  end

  describe 'GET #will_become_private', only: true do
    let(:other_user) { create(:user) }
    let(:parent) { create(:collection, add_editors: [user]) }
    let(:collection) { create(:collection, parent_collection: parent) }
    let(:path) { "/api/v1/collections/#{collection.id}/roles/will_become_private" }

    context 'when making a change that would cause the child to become private' do
      let(:params) {
        {
          role_name: 'editor',
          remove_identifiers: ["User_#{user.id}"],
        }
      }
      it 'should return false' do
        get(path, params: params)
        expect(json['inherit']).to be false
      end
    end

    context 'when making a change that would not cause the child to become private' do
      let(:params) {
        {
          role_name: 'editor',
          remove_identifiers: ["User_#{other_user.id}"],
        }
      }
      it 'should return true' do
        get(path, params: params)
        expect(json['inherit']).to be true
      end
    end

    context 'with groups' do
      let(:group) { create(:group, add_members: [other_user]) }
      let(:editor_group) { create(:group, add_members: [user]) }
      let(:parent) { create(:collection, add_editors: [editor_group, user], add_viewers: [group]) }

      context 'when making a change that would cause the child to become private' do
        let(:params) {
          {
            role_name: 'editor',
            remove_identifiers: ["Group_#{group.id}"],
          }
        }
        it 'should return false' do
          get(path, params: params)
          expect(json['inherit']).to be false
        end
      end

      context 'when making a change that would not cause the child to become private' do
        let(:parent) { create(:collection, add_editors: [editor_group, user]) }
        let(:collection) { create(:collection, parent_collection: parent, add_editors: [editor_group, user, group]) }
        let(:params) {
          {
            role_name: 'editor',
            # user is still an editor even if you remove them from the group
            remove_identifiers: ["Group_#{group.id}"],
          }
        }
        it 'should return true' do
          get(path, params: params)
          expect(json['inherit']).to be true
        end
      end
    end
  end
end
