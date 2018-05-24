require 'rails_helper'

describe Api::V1::NotificationsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #index' do
    let(:organization) { user.current_organization }
    let(:collection) { create(:collection) }
    let!(:activity) { create(:activity, organization: organization, actor: create(:user), target: collection) }
    let!(:notification) { create(:notification, activity: activity, user: user) }
    let!(:outside_notification) { create(:notification, activity: activity) }
    let(:path) { '/api/v1/notifications/' }

    before do

    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data'][0]['attributes']).to match_json_schema('notification')
    end

    it 'returns notifications belonging to current user of current organization' do
      get(path)
      expect(json['data'].length).to eq(1)
    end
  end
end
