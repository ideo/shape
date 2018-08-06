require 'rails_helper'

describe Api::V1::OrganizationsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'POST #create' do
    let(:path) { '/api/v1/activities/' }
    let!(:current_user) { create(:user) }
    let!(:collection) { create(:collection) }
    let(:params) {
      json_api_params(
        'activities',
        'action': 'downloaded',
        'target_type': 'collections',
        'target_id': collection.id,
      )
    }

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(204)
    end
  end
end
