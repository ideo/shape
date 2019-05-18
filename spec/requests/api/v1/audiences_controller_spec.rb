require 'rails_helper'

describe Api::V1::AudiencesController, type: :request, json: true do
  describe 'GET #index' do
    context 'when it is the users survey response', auth: true do
      let!(:current_user) { @user }
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
end
