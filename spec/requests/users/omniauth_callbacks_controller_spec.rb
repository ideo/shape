require 'rails_helper'

describe Users::OmniauthCallbacksController, type: :request do
  describe 'POST #okta' do
    let!(:organization) { create(:organization) }
    let!(:user) { build(:user) }
    let(:email) { user.email }
    let(:pic_url_square) { user.pic_url_square }
    let(:first_name) { user.first_name }
    let(:path) { '/users/auth/okta/callback' }

    before do
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:okta] = OmniAuth::AuthHash.new(
        provider: 'okta',
        uid: user.uid,
        info: {
          first_name: first_name,
          last_name: user.last_name,
          email: email,
          image: pic_url_square,
        },
      )
      Rails.application.env_config['devise.mapping'] = Devise.mappings[:user]
      Rails.application.env_config['omniauth.auth'] = OmniAuth.config.mock_auth[:okta]
    end

    after :all do
      OmniAuth.config.mock_auth[:okta] = nil
    end

    it 'should redirect to the root url' do
      post(path)
      expect(response.status).to eq(302)
      expect(response).to redirect_to('http://www.example.com/')
    end

    it 'should create the user' do
      expect { post(path) }.to change(User, :count).by(1)
      expect(User.find_by_uid(user.uid)).not_to be_nil
    end

    it 'should create org for user' do
      expect { post(path) }.to change(Organization, :count).by(1)
      expect(User.find_by_uid(user.uid).current_organization).not_to be_nil
    end

    context 'with updated email and pic' do
      let!(:email) { 'newemail@user.com' }
      let!(:pic_url_square) { 'newpic.jpg' }
      let!(:first_name) { 'Barney' }

      before do
        user.save
      end

      it 'should update the user' do
        expect(user.email).not_to eq(email)
        expect(user.pic_url_square).not_to eq(pic_url_square)
        expect(user.first_name).not_to eq(first_name)

        post(path)
        user.reload

        expect(user.email).to eq(email)
        expect(user.pic_url_square).to eq(pic_url_square)
        expect(user.first_name).to eq(first_name)
      end
    end

    context 'with okta auth domain matching current organization' do
      let!(:organization) { create(:organization, domain_whitelist: ['company.org']) }
      let!(:user) { build(:user, current_organization: organization, email: 'personal@hotmail.com') }

      before do
        # should add to guest group
        organization.add_new_user(user)
        OmniAuth.config.mock_auth[:okta] = OmniAuth::AuthHash.new(
          provider: 'okta',
          uid: user.uid,
          info: {
            first_name: first_name,
            last_name: user.last_name,
            email: 'user@company.org',
            image: pic_url_square,
          },
        )
        Rails.application.env_config['devise.mapping'] = Devise.mappings[:user]
        Rails.application.env_config['omniauth.auth'] = OmniAuth.config.mock_auth[:okta]
      end

      it 'updates user membership to primary group if they login with their company email' do
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be true
        post(path)
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be false
        expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
      end
    end
  end
end
