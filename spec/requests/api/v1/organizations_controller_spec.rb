require 'rails_helper'

describe Api::V1::OrganizationsController, type: :request, auth: true do
  describe 'GET #current' do
    let!(:organization) { create(:organization) }
    let(:user) { @user }
    let(:path) { '/api/v1/organizations/current' }

    before do
      user.update_attributes(current_organization: organization)
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches user.current_organization' do
      get(path)
      expect(json['data']['id'].to_i).to eq(user.current_organization_id)
    end
  end

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
          'name': 'Acme Inc 2.0',
          'pic_url_square': 'https://filestack.com/image.jpg'
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

    it 'updates the name' do
      expect(organization.name).not_to eq('Acme Inc 2.0')
      patch(path, params: params)
      expect(organization.reload.name).to eq('Acme Inc 2.0')
    end

    it 'updates the pic url' do
      expect(organization.pic_url_square)
        .not_to eq('https://filestack.com/image.jpg')
      patch(path, params: params)
      expect(organization.reload.pic_url_square)
        .to eq('https://filestack.com/image.jpg')
    end
  end
end
