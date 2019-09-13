require 'rails_helper'

describe HomeController, skip_frontend_render: true, type: :request do
  describe 'GET #index' do
    let(:path) { '/' }

    context 'with a limited user' do
      let(:limited_user) { create(:user, status: :limited) }
      before do
        log_in_as_user(limited_user)
      end

      it 'redirects if you are signed in as a limited user' do
        expect(get(path)).to redirect_to(root_url)
      end
    end
  end

  describe 'GET #login' do
    context 'with redirect param' do
      let(:redirect) { 'http://www.shape.space/redirectpath' }
      let(:path) { "/login?redirect=#{redirect}" }

      before do
        allow_any_instance_of(HomeController).to receive(:store_location_for).and_wrap_original do |m, *args|
          m.call(args[1], args[2])
        end
      end

      it 'remembers where to redirect the user' do
        expect_any_instance_of(HomeController).to receive(:store_location_for).with(
          :user, redirect
        )
        get(path)
      end

      context 'with organization slug' do
        let!(:organization) { create(:organization, slug: 'intl-company') }
        let!(:redirect) { 'http://www.shape.space/intl-company' }

        it 'assigns @redirect_organization' do
          get(path)
          expect(assigns(:redirect_organization)).to eq(organization)
        end
      end
    end
  end

  describe 'GET #sign_up' do
    let(:redirect) { nil }
    let(:path) { "/sign_up?redirect=#{redirect}" }

    it 'returns 200' do
      get(path)
      expect(response.status).to eq 200
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
        expect(assigns(:redirect_organization)).to be_nil
      end
    end
  end
end
