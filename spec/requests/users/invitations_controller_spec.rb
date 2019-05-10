require 'rails_helper'

describe InvitationsController, type: :request do
  describe 'GET #accept' do
    let(:pending_user) { create(:user, :pending) }
    let(:redirect) { 'http://localhost:3000/my/redirect' }
    let(:path) do
      "/invitations/#{invitation_token}?redirect=#{redirect}"
    end

    context 'with a pending user' do
      let(:invitation_token) { pending_user.invitation_token }

      it 'redirects to signup with the user email' do
        expect(get(path)).to redirect_to(sign_up_url(email: pending_user.email))
      end
    end

    context 'with an invalid token' do
      let(:invitation_token) { SecureRandom.hex }

      it 'redirects to login' do
        expect(get(path)).to redirect_to(login_url)
      end
    end
  end
end
