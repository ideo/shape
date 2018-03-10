require 'rails_helper'

describe Api::V1::RolesController, type: :request, auth: true do
  describe 'GET #index' do
    let!(:collection) { create(:collection) }
    let!(:editor) { create(:user) }
    let!(:viewer) { create(:user) }
    let(:path) { "/api/v1/collections/#{collection.id}/roles" }
    let(:users_json) { json_included_objects_of_type('users') }

    before do
      editor.add_role(Role::EDITOR, collection)
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
    let!(:collection) { create(:collection) }
    let!(:editor) { create(:user) }
    let(:path) { "/api/v1/collections/#{collection.id}/roles" }
    let(:emails) { [Faker::Internet.email, Faker::Internet.email] }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:params) {
      {
        'role': { 'name': 'editor' },
        'user_ids': [editor.id],
        'emails': emails,
      }.to_json
    }

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'returns one role' do
      post(path, params: params)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['attributes']['name']).to eq('editor')
    end

    it 'returns two pending users from emails who are editors' do
      post(path, params: params)
      pending_users_json = users_json.select { |u| u['attributes']['status'] == 'pending' }
      pending_users_emails = pending_users_json.map { |u| u['attributes']['email'] }
      expect(pending_users_emails).to match_array(emails)

      pending_users = User.where(id: pending_users_json.map { |u| u['attributes']['id'] })
      expect(pending_users.size).to eq(2)
      pending_users.each do |user|
        expect(user.has_role?(Role::EDITOR, collection)).to be true
      end
    end

    it 'returns existing user who is now editor' do
      post(path, params: params)
      expect(users_json.map { |u| u['attributes']['id'].to_i }).to include(editor.id)
      expect(editor.reload.has_role?(Role::EDITOR, collection)).to be true
    end
  end

  describe 'DELETE #destroy' do
    let!(:collection) { create(:collection) }
    let!(:editor) { create(:user) }
    let!(:role) { editor.add_role(Role::EDITOR, collection) }
    let(:path) { "/api/v1/users/#{editor.id}/roles/#{role.id}" }

    it 'returns a 200' do
      delete(path)
      expect(response.status).to eq(200)
    end

    it 'deletes the UserRole' do
      expect { delete(path) }.to change(UsersRole, :count).by(-1)
    end

    it 'matches Role schema' do
      delete(path)
      expect(editor.reload.has_role?(Role::EDITOR, collection)).to be false
    end
  end
end
