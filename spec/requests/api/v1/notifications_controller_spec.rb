require 'rails_helper'

describe Api::V1::NotificationsController, type: :request, json: true, auth: true do
  let(:user) { @user }
  let(:organization) { user.current_organization }
  let(:collection) { create(:collection) }
  let!(:activity) { create(:activity, organization: organization, actor: create(:user), target: collection) }
  let!(:notification) { create(:notification, activity: activity, user: user) }

  describe 'GET #index' do
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

  describe 'PATCH #update' do
    let(:path) { "/api/v1/notifications/#{notification.id}" }
    let(:params) do
      json_api_params(
        'notifications',
        {
          read: true,
        }
      )
    end

    it 'returns a 204 no content' do
      patch(path, params: params)
      expect(response.status).to eq(204)
    end

    it 'updates the content' do
      expect(notification.read).to be(false)
      patch(path, params: params)
      expect(notification.reload.read).to be(true)
    end
  end
end
