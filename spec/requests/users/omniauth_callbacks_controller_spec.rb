require 'rails_helper'

describe Users::OmniauthCallbacksController, type: :request do
  describe 'POST #ideo' do
    let!(:organization) { create(:organization) }
    let!(:user) { build(:user) }
    let(:email) { user.email }
    let(:picture) { user.picture }
    let(:first_name) { user.first_name }
    let(:path) { '/users/auth/ideo/callback' }

    before do
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:ideo] = OmniAuth::AuthHash.new(
        provider: 'ideo',
        uid: user.uid,
        info: {
          first_name: first_name,
          last_name: user.last_name,
          email: email,
          picture: picture,
        },
        extra: {
          raw_info: {
            picture: picture,
            picture_medium: "#{picture}_md",
            picture_large: "#{picture}_lg",
          },
        },
      )
      Rails.application.env_config['devise.mapping'] = Devise.mappings[:user]
      Rails.application.env_config['omniauth.auth'] = OmniAuth.config.mock_auth[:ideo]
    end

    after :all do
      OmniAuth.config.mock_auth[:ideo] = nil
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

    context 'pending user is an admin of current organization' do
      let!(:pending_user) do
        organization = create(:organization)
        create(:user, :pending, current_organization: organization)
      end

      before do
        get('/invitations', params: { token: pending_user.invitation_token })
      end

      it 'adds the user as a network admin' do
        allow(pending_user).to receive(:add_network_admin)
        post(path)
        expect(pending_user).not_to have_received(:add_network_admin).with(
          organization.id,
        )

        pending_user.add_role(Role::ADMIN, pending_user.current_organization.admin_group)
        post(path)
        expect(pending_user).to have_received(:add_network_admin).with(
          pending_user.current_organization.id,
        )
      end
    end

    context 'with updated email and pic' do
      let!(:email) { 'newemail@user.com' }
      let!(:picture) { 'newpic.jpg' }
      let!(:first_name) { 'Barney' }

      before do
        user.save
      end

      it 'should update the user' do
        expect(user.email).not_to eq(email)
        expect(user.picture).not_to eq(picture)
        expect(user.first_name).not_to eq(first_name)

        post(path)
        user.reload

        expect(user.email).to eq(email)
        expect(user.picture).to eq(picture)
        expect(user.first_name).to eq(first_name)
      end
    end

    context 'with ideo auth domain matching current organization' do
      let!(:organization) { create(:organization, domain_whitelist: ['mycompany.org']) }
      let!(:user) { build(:user, current_organization: organization, email: 'personal@hotmail.com') }

      before do
        # should add to guest group
        organization.setup_user_membership(user)
        OmniAuth.config.mock_auth[:ideo].info.email = 'user@mycompany.org'
        Rails.application.env_config['omniauth.auth'] = OmniAuth.config.mock_auth[:ideo]
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
