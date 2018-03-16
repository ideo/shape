require 'rails_helper'

describe Api::V1::RolesController, type: :request, auth: true do
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
    let(:users) { create_list(:user, 3) }
    let(:user_ids) { users.map(&:id) }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:params) {
      {
        'role': { 'name': 'editor' },
        'user_ids': user_ids,
      }.to_json
    }

    context 'on a collection' do
      let!(:collection) { create(:collection, add_editors: [user]) }
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
  end

  describe 'DELETE #destroy' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let!(:viewer) { create(:user) }
    let!(:role) { viewer.add_role(Role::VIEWER, collection) }
    let(:path) { "/api/v1/users/#{viewer.id}/roles/#{role.id}" }

    it 'returns a 200' do
      delete(path)
      expect(response.status).to eq(200)
    end

    it 'deletes the UserRole' do
      expect { delete(path) }.to change(UsersRole, :count).by(-1)
    end

    it 'matches Role schema' do
      delete(path)
      expect(viewer.reload.has_role?(Role::VIEWER, collection)).to be false
    end
  end
end
