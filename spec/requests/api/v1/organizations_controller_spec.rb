require 'rails_helper'

describe Api::V1::OrganizationsController, type: :request, auth: true do
  describe 'GET #show' do
    let!(:organization) { create(:organization) }
    let(:path) { "/api/v1/organizations/#{organization.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches User schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('organization')
    end
  end

  describe 'PATCH #update' do
    let!(:organization) { create(:organization) }
    let(:path) { "/api/v1/organizations/#{organization.id}" }
    let(:params) {
      json_api_params(
        'organizations',
        {
          'name': 'Acme Inc 2.0'
        }
      )
    }

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('organization')
    end

    it 'updates the content' do
      expect(organization.name).not_to eq('Acme Inc 2.0')
      patch(path, params: params)
      expect(organization.reload.name).to eq('Acme Inc 2.0')
    end
  end
end
