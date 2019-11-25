require 'rails_helper'

describe Api::V1::TestAudiencesController, type: :request, json: true, auth: true do
  let(:current_user) { @user }
  let(:organization) { create(:organization, admin: current_user) }
  let!(:link_sharing_audience) { create(:audience, :link_sharing, organizations: [organization]) }
  let!(:paid_audience) { create(:audience, organizations: [organization]) }
  let!(:test_collection) { create(:test_collection, :completed, add_editors: [current_user]) }

  describe 'PATCH #update' do
    let(:status) { :open }
    let(:test_audience) do
      # link sharing gets created after_create
      test_collection.test_audiences.first
    end
    let(:params) do
      json_api_params(
        'test_audiences',
        status: status,
      )
    end
    let(:path) { "/api/v1/test_audiences/#{test_audience.id}" }

    before do
      # launch + create test design
      test_collection.launch!(initiated_by: current_user)
    end

    context 'with a paid audience' do
      let!(:test_audience) do
        # link sharing gets created after_create
        create(:test_audience, test_collection: test_collection, audience: paid_audience)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'without editor access' do
      let!(:current_user) { create(:user) }

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with a link sharing audience' do
      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        patch(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('test_audience')
      end

      it 'saves the test audience' do
        expect {
          patch(path, params: params)
          test_audience.reload
        }.to change(test_audience, :status)
      end
    end
  end
end
