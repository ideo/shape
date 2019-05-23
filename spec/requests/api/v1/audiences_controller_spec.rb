require 'rails_helper'

describe Api::V1::AudiencesController, type: :request, json: true do
  let(:user) { @user }

  describe 'GET #index' do
    context 'when it is the users survey response', auth: true do
      let!(:current_user) { user }
      let(:organization) { create(:organization, admin: current_user) }
      let(:audience1) { create(:audience) }
      let(:audience2) { create(:audience, organization: organization) }
      let(:path) { "/api/v1/organizations/#{organization.id}/audiences/" }

      it 'returns a 200' do
        get(path)
        expect(response.status).to eq(200)
      end
    end
  end

  describe 'POST #create', auth: true, create_org: true do
    let(:current_user) { user }
    let(:path) { '/api/v1/audiences' }
    let(:params) do
      json_api_params(
        'audiences',
        name: 'Anyone',
      )
    end

    context 'without org admin access' do
      before do
        user.remove_role(Role::ADMIN, user.current_organization.primary_group)
      end

      it 'returns a 401 if user is not an org admin' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with org admin access' do
      before do
        user.add_role(Role::ADMIN, user.current_organization.primary_group)
      end

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'creates new audience' do
        expect { post(path, params: params) }.to change(Audience, :count).by(1)
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('audience')
      end
    end
  end
end
