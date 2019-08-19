require 'rails_helper'

describe Api::V1::UsersController, type: :request, json: true, auth: true, create_org: true do
  let(:user) { @user }

  describe 'GET #show' do
    let(:path) { "/api/v1/users/#{user.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches User schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('user')
    end
  end

  describe 'GET #me' do
    let(:path) { '/api/v1/users/me' }
    before do
      allow(GoogleAuthService).to receive(:create_custom_token).and_return('token')
    end

    it 'updates the users last_active_at timestamp' do
      expect { get(path) }.to change(user, :last_active_at)
      expect(
        user.last_active_at_in_org(user.current_organization_id)
      ).to be_within(1.second).of(Time.current)
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches User ID' do
      get(path)
      expect(json['data']['id'].to_i).to eq(user.id)
      expect(assigns(:current_user)).to eq(user)
    end

    it 'matches User schema for current user (with personal attributes)' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('user_me')
    end

    context 'with Application API Token', auth: false, create_org: false do
      let!(:api_token) { create(:api_token) }
      let!(:user) { api_token.application_user }

      it 'returns a 200' do
        get(path, headers: headers_with_token(api_token.token))
        expect(response.status).to eq(200)
      end

      it 'matches User ID' do
        get(path, headers: headers_with_token(api_token.token))
        expect(json['data']['id'].to_i).to eq(user.id)
        expect(assigns(:current_user)).to eq(user)
      end
    end
  end

  describe 'POST #create_from_emails', :vcr do
    let(:emails) { Array.new(3).map { Faker::Internet.email } }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:path) { '/api/v1/users/create_from_emails' }
    let(:params) do
      {
        'emails': emails,
      }.to_json
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'returns 3 pending users' do
      post(path, params: params)
      expect(json['data'].size).to eq(3)
      expect(json['data'].map { |u| u['attributes']['email'] }).to match_array(emails)
      expect(json['data'].all? { |u| u['attributes']['status'] == 'pending' }).to be true
    end
  end

  describe 'PATCH #update_current_user' do
    let(:path) { '/api/v1/users/update_current_user' }
    let(:params) do
      {
        user:
        {
          terms_accepted: true,
          show_helper: false,
          show_move_helper: false,
          show_template_helper: false,
          feedback_terms_accepted: true,
        },
      }.to_json
    end

    before do
      user.update_attributes(terms_accepted: false, show_helper: true, feedback_terms_accepted: false)
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'updates terms_accepted for current_user' do
      expect(user.terms_accepted).to be false
      patch(path, params: params)
      expect(user.reload.terms_accepted).to be true
    end

    it 'updates feedback_terms_accepted for current_user' do
      expect(user.feedback_terms_accepted).to be false
      patch(path, params: params)
      expect(user.reload.feedback_terms_accepted).to be true
    end

    it 'updates show_helpers for current_user' do
      expect(user.show_helper).to be true
      expect(user.show_move_helper).to be true
      expect(user.show_template_helper).to be true
      patch(path, params: params)
      user.reload
      expect(user.show_helper).to be false
      expect(user.show_move_helper).to be false
      expect(user.show_template_helper).to be false
    end
  end

  describe 'PATCH #update_current_user' do
    let(:organization) { user.current_organization }
    let(:path) { '/api/v1/users/accept_current_org_terms' }

    before do
      organization.update(terms_version: 3, terms_text_item: create(:text_item))
    end

    it 'returns a 200' do
      patch(path)
      expect(response.status).to eq(200)
    end

    it 'updates current_org_terms_accepted for current_user' do
      expect(user.current_org_terms_accepted).to be false
      patch(path)
      expect(user.reload.current_org_terms_accepted).to be true
      expect(user.org_terms_accepted_versions[organization.id.to_s]).to eq 3
    end
  end

  describe 'POST #create_limited_user', auth: false, create_org: false do
    let(:path) { '/api/v1/users/create_limited_user' }
    let(:session_uid) { nil }
    let(:contact_info) do
      { contact_info: 'something@somewhere.com' }
    end
    let(:raw_params) do
      contact_info.merge(session_uid: session_uid)
    end
    let(:params) { raw_params.to_json }
    let(:service_double) { double('service') }
    let(:limited_user) { create(:user, status: :limited) }

    before do
      allow(service_double).to receive(:call).and_return(true)
      allow(service_double).to receive(:limited_user).and_return(limited_user)
      allow(service_double).to receive(:created).and_return(true)
      # LimitedUserCreator should get called
      expect(LimitedUserCreator).to receive(:new).with(contact_info).and_return(service_double)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq 200
    end

    it 'signs in the user' do
      expect {
        post(path, params: params)
      }.to change(limited_user, :last_sign_in_at)
    end

    context 'with an existing survey response' do
      let(:session_uid) { '123-xyz' }
      let!(:survey_response) { create(:survey_response, user_id: nil, session_uid: session_uid) }

      it 'updates the survey response to be marked with the newly created user id' do
        post(path, params: params)
        expect(survey_response.reload.user_id).to eq limited_user.id
      end

      it 're-runs SurveyResponseCompletion to ensure that incentives are marked' do
        expect(SurveyResponseCompletion).to receive(:call).with(survey_response)
        post(path, params: params)
      end
    end

    context 'with an existing user' do
      before do
        allow(service_double).to receive(:created).and_return(false)
      end

      let(:session_uid) { '123-xyz' }
      let!(:survey_response) { create(:survey_response, user_id: nil, session_uid: session_uid) }

      it 'does not sign in the user' do
        expect {
          post(path, params: params)
        }.not_to change(limited_user, :last_sign_in_at)
      end
    end
  end
end
