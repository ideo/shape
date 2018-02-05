require 'rails_helper'

describe Api::V1::UsersController, type: :request do
  describe 'GET #show' do
    let!(:user) { create(:user) }
    let(:path) { "/api/v1/users/#{user.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches User schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('user')
    end
  end
end
