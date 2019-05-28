require 'rails_helper'

describe TestsController, type: :request do
  include IdeoSsoHelper
  let(:test_collection) { create(:test_collection) }

  before do
    # NOTE: not doing any normal rendering of the index page because we defer to Cypress for those,
    # and they make for slow request specs
    allow_any_instance_of(TestsController).to receive(:render).and_return 'rendered.'
  end

  describe 'GET #show' do
    let(:path) { "/tests/#{test_collection.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq 200
    end
  end

  describe 'GET #token_auth' do
    let(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, test_collection: test_collection) }
    let(:user) { create(:user, status: :limited) }
    let(:token) { 'xyz' }
    let(:path) { "/tests/t/#{token}" }
    let(:fake_user_token) { 'my-token-123' }

    before do
      allow_any_instance_of(User).to receive(:generate_network_auth_token).and_return(fake_user_token)
    end

    context 'with a matching invitation' do
      let(:test_audience_invitation) { create(:test_audience_invitation, test_audience: test_audience, user: user) }
      let(:token) { test_audience_invitation.invitation_token }

      it 'should redirect to ideo_sso_token_auth_url' do
        get(path)
        expect(response).to redirect_to ideo_sso_token_auth_url(fake_user_token)
      end
    end

    context 'without a matching invitation' do
      it 'should redirect to root_url' do
        get(path)
        expect(response).to redirect_to root_url
      end
    end
  end
end
