require 'rails_helper'

describe Api::V1::AudiencesController, type: :request, json: true, create_org: true do
  let(:user) { @user }

  describe 'GET #index' do
    context 'when it is the users survey response', auth: true do
      let(:organization1) { user.current_organization }
      let(:organization2) { create(:organization) }
      let!(:audience1) { create(:audience) }
      let!(:audience2) { create(:audience, organizations: [organization1]) }
      let!(:audience3) { create(:audience, organizations: [organization2]) }
      let(:path) { "/api/v1/organizations/#{organization1.id}/audiences/" }

      it 'returns a 200' do
        get(path)
        expect(response.status).to eq(200)
      end

      it 'returns audiences' do
        get(path)

        audience_ids = json['data'].map { |a| a['id'] }
        expect(audience_ids.size).to eq(2)
        expect(audience_ids).to include(audience1.id.to_s)
        expect(audience_ids).to include(audience2.id.to_s)

        json['data'].each do |actual_audience|
          expect(actual_audience['attributes']['global']).to eq(actual_audience['id'] == audience1.id.to_s)
        end
      end
    end
  end

  describe 'POST #create', auth: true do
    let(:path) { '/api/v1/audiences' }
    let(:params) do
      json_api_params(
        'audiences',
        name: 'Anyone',
        tag_list: 'one, two, three',
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

        audience = Audience.last
        expect(audience.name).to eq('Anyone')
        expect(audience.tag_list.size).to eq(3)
        expect(audience.organizations).to include(user.current_organization)
        expect(audience.price_per_response).to eq(Shape::TARGETED_AUDIENCE_PRICE_PER_RESPONSE)
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('audience')
      end
    end
  end
end
