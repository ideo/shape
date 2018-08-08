require 'rails_helper'

describe Api::V1::ActivitiesController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'POST #create' do
    let(:path) { '/api/v1/activities/' }
    let(:collection) { create(:collection) }
    let(:action) { 'downloaded' }
    let(:params) {
      json_api_params(
        'activities',
        'action': action,
        'target_type': 'collections',
        'target_id': collection.id,
      )
    }

    before do
      user.add_role(Role::EDITOR, collection)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(204)
    end

    it 'calls the ActivityAndNotificationBuilder' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: user,
        target: collection,
        action: action,
        subject_user_ids: [user.id],
        subject_group_ids: [],
      )
      post(path, params: params)
    end
  end
end
