require 'rails_helper'

describe InvitationsController, type: :request do
  describe 'GET #accept' do
    let(:pending_user) { create(:user, :pending) }
    let(:redirect) { 'http://localhost:3000/my/redirect' }
    let(:path) do
      "/invitations/#{pending_user.invitation_token}?redirect=#{redirect}"
    end

    context 'with a pending user' do
      it 'redirects to signup with the user email' do
        expect(get(path)).to redirect_to(sign_up_url(email: pending_user.email))
      end

      it 'stores the token in session' do
        get(path)
        expect(session[:pending_user_token]).to eq pending_user.invitation_token
      end
    end

    context 'without a pending user' do
      let(:pending_user) { create(:user, invitation_token: nil) }

      it 'redirects to login' do
        expect(get(path)).to redirect_to(login_url)
      end
    end
  end
end
