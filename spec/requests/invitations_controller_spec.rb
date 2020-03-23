require 'rails_helper'

describe InvitationsController, type: :request do
  let(:user) { create(:user, :pending) }
  let(:network_invitation) { create(:network_invitation, user: user) }

  before do
    # NOTE: not doing any normal rendering of the index page because we defer to Cypress for those,
    # and they make for slow request specs
    allow_any_instance_of(HomeController).to receive(:render).and_return 'rendered.'
  end

  describe 'GET #accept' do
    let(:token) { network_invitation.token }
    let(:redirect) { 'https://www.shape.space/authredirect' }
    let(:path) { "/invitations/#{token}?redirect=#{redirect}" }

    it 'returns a 302' do
      get(path)
      expect(response.status).to eq 302
    end

    it 'redirects to sign up' do
      get(path)
      expect(response).to redirect_to(
        sign_up_url(email: user.email, redirect: redirect, token: token),
      )
    end

    context 'with an active user' do
      let(:user) { create(:user) }

      it 'redirects to login with the redirect and email param' do
        get(path)
        expect(response).to redirect_to(
          login_url(email: user.email, redirect: redirect),
        )
      end
    end

    context 'with invalid token' do
      let!(:token) { SecureRandom.hex }

      it 'redirects to login' do
        get(path)
        expect(response).to redirect_to(
          login_url(redirect: redirect),
        )
      end
    end
  end
end
