require 'rails_helper'

describe Api::V1::RolesController, type: :request, json: true, auth: true do
  let(:user) { @user }

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

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'returns one role' do
        post(path, params: params)
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['attributes']['name']).to eq('editor')
      end

      it 'adds role to users' do
        post(path, params: params)
        expect(users.all? { |u| u.reload.has_role?(:editor, collection) }).to be true
      end

      context 'with pending users' do
        let!(:pending_users) { create_list(:user, 3, :pending) }
        let!(:user_ids) { pending_users.map(&:id) }

        it 'adds role to users' do
          post(path, params: params)
          expect(pending_users.all? { |u| u.reload.has_role?(:editor, collection) }).to be true
        end
      end
    end

    context 'on an item' do
      let!(:item) { create(:text_item, add_editors: [user]) }
      # item also needs a collection w/ an org in order to assign permissions
      let!(:collection) { create(:collection, organization: organization) }
      let!(:collection_card) { create(:collection_card, item: item, parent: collection) }
      let(:path) { "/api/v1/items/#{item.id}/roles" }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'adds role to users' do
        post(path, params: params)
        expect(users.all? { |u| u.reload.has_role?(:editor, item) }).to be true
      end
    end

    context 'on an group' do
      let!(:group) { create(:group, organization: organization, add_admins: [user]) }
      let(:path) { "/api/v1/groups/#{group.id}/roles" }
      let!(:role_name) { 'member' }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'adds role to users' do
        post(path, params: params)
        expect(users.all? { |u| u.reload.has_role?(:member, group) }).to be true
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
      let(:remove_viewer) { viewers[0] }
      let(:params) do
        {
          role: { name: 'viewer' },
          user_ids: [remove_viewer.id],
          is_switching: false,
        }.to_json
      end
      let(:role) { collection.roles.find_by(name: Role::VIEWER) }
      let(:path) { "/api/v1/collections/#{collection.id}/roles/#{role.id}" }

      it 'returns a 200' do
        delete(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'matches Role schema' do
        delete(path, params: params)
        expect(viewers.first.reload.has_role?(Role::VIEWER, collection)).to be false
      end

      it 'deletes the UserRole' do
        expect { delete(path, params: params) }.to change(UsersRole, :count).by(-1)
      end

      it 'does not delete Role' do
        expect { delete(path, params: params) }.not_to change(Role, :count)
        expect(Role.exists?(role.id))
      end

      it 'does not delete the Group role' do
        delete(path, params: params)
        expect(group.reload.has_role?(Role::VIEWER, collection)).to be true
      end

      context 'with cards/children' do
        let!(:num_cards) { 3 }

        before do
          collection.items.each(&:inherit_roles_from_parent!)
        end

        it 'removes roles' do
          expect(
            collection.items.all? do |item|
              remove_viewer.has_role?(Role::VIEWER, item)
            end,
          ).to be true

          Sidekiq::Testing.inline! do
            delete(path, params: params)
            remove_viewer.reload
            expect(
              collection.items.all? do |item|
                remove_viewer.has_role?(Role::VIEWER, item)
              end,
            ).to be false
          end
        end
      end

      context 'as viewer', auth: false, create_org: false do
        # Needs org and editor created because auth is false
        let!(:organization) { create(:organization) }
        let!(:editor) { create(:user, add_to_org: organization) }

        before do
          log_in_as_user(viewers.first)
        end

        context 'trying to remove someone else' do
          let(:path) { "/api/v1/users/#{editor.id}/roles/#{role.id}" }

          it 'returns 401' do
            delete(path, params: params)
            expect(response.status).to eq(401)
          end
        end

        context 'trying to remove yourself' do
          let(:path) { "/api/v1/users/#{remove_viewer.id}/roles/#{role.id}" }

          it 'returns 200' do
            delete(path, params: params)
            expect(response.status).to eq(200)
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

      it 'returns 200' do
        delete(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'deletes the GroupsRole record' do
        expect { delete(path, params: params) }.to change(GroupsRole, :count).by(-1)
        expect(group.reload.has_role?(Role::EDITOR, collection)).to be false
      end

      it 'does not delete the viewer role' do
        delete(path, params: params)
        expect(viewers.first.reload.has_role?(Role::VIEWER, collection)).to be true
      end

      context 'with cards/children' do
        let!(:num_cards) { 3 }

        before do
          collection.items.each(&:inherit_roles_from_parent!)
        end

        it 'removes roles' do
          expect(
            collection.items.all? do |item|
              group.has_role?(Role::EDITOR, item)
            end,
          ).to be true

          Sidekiq::Testing.inline! do
            delete(path, params: params)
            group.reload
            expect(
              collection.items.all? do |item|
                group.has_role?(Role::EDITOR, item)
              end,
            ).to be false
          end
        end
      end

      context 'user is not group member/admin' do
        before do
          editor.remove_role(Role::ADMIN, group)
        end

        it 'returns a 401' do
          delete(path)
          expect(response.status).to eq(401)
        end
      end

      context 'user is also collection admin' do
        before do
          editor.add_role(Role::EDITOR, collection)
        end

        it 'returns a 200' do
          delete(path, params: params)
          expect(response.status).to eq(200)
        end

        it 'deletes the GroupsRole record' do
          expect { delete(path, params: params) }.to change(GroupsRole, :count).by(-1)
          expect(group.reload.has_role?(Role::EDITOR, collection)).to be false
        end
      end
    end
  end
end
