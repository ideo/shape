require 'rails_helper'

describe InvitationsController, type: :request do
  let(:pending_user) { create(:user, :pending) }

  before do
    # NOTE: not doing any normal rendering of the index page because we defer to Cypress for those,
    # and they make for slow request specs
    allow_any_instance_of(InvitationsController).to receive(:render).and_return 'rendered.'
  end

  describe 'GET #accept' do
    let(:token) { pending_user.invitation_token }
    let(:redirect) { 'https://www.shape.space/authredirect' }
    let(:path) { "/invitations/#{token}?redirect=#{redirect}" }

    it 'returns a 302' do
      get(path)
      expect(response.status).to eq 302
    end

    it 'redirects to sign up' do
      get(path)
      expect(response).to redirect_to(
        sign_up_url(email: pending_user.email),
      )
    end

    context 'with invalid token' do
      let!(:token) { SecureRandom.hex }

      it 'redirects to login' do
        get(path)
        expect(response).to redirect_to(login_url)
      end
    end

    context 'with redirect that has organization slug' do
      let!(:organization) { create(:organization, slug: 'intl-company') }
      let!(:redirect) { 'http://www.shape.space/intl-company' }

      it 'assigns @redirect_organization' do
        get(path)
        expect(assigns(:redirect_organization)).to eq(organization)
      end
    end

    context 'with redirect that has invalid organization slug' do
      let!(:redirect) { 'http://www.shape.space/intl-company' }

      it 'does not assign @redirect_organization' do
        get(path)
        expect(response).to redirect_to(
          sign_up_url(email: pending_user.email),
        )
        expect(assigns(:redirect_organization)).to be_nil
      end
    end
  end
end
