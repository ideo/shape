require 'rails_helper'

describe Api::V1::Admin::UsersController, type: :request, json: true, auth: true, create_org: true do
  let(:admin_user) { @user }

  before do
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #index' do
    let!(:non_admin_user) { create(:user) }
    let(:path) { "/api/v1/admin/users" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns users with shape_admin role' do
      get(path)
      expect(json['data'].size).to eq(1)
      expect(json['data'][0]['id'].to_i).to eq(admin_user.id)
    end
  end

  describe 'DELETE #destroy' do
    let(:path) { "/api/v1/admin/users/#{admin_user.id}" }

    it 'returns a 204 no content' do
      delete(path)
      expect(response.status).to eq(204)
    end

    it 'removes the shape_admin role from the user' do
      delete(path)
      expect(admin_user.has_role?(Role::SHAPE_ADMIN)).to be(false)
    end
  end
end
