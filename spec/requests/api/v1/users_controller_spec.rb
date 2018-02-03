require 'rails_helper'

describe Api::V1::UsersController, type: :request do
  describe 'GET #show' do
    let!(:user) { create(:user) }
    let(:path) { "/api/v1/users/#{user.id}.json" }

    it 'should have 200 status' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'should have expected JSON' do
      get(path)
      debugger
      expect(json['data']['attributes']).to match_json_schema('user')
    end
  end
end
