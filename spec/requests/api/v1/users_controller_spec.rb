require 'rails_helper'

describe Api::V1::UsersController, type: :request, json: true, auth: true, create_org: true do
  let(:user) { @user }

  describe 'GET #index' do
    let!(:organization) { user.current_organization }
    let!(:org_users) { create_list(:user, 3) }
    let!(:org_guests) { create_list(:user, 1) }
    let!(:other_org) { create(:organization) }
    let!(:other_org_users) { create_list(:user, 3) }
    let!(:pending_users) { create_list(:user, 2, :pending) }
    let(:path) { "/api/v1/organizations/#{organization.id}/users" }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
      org_users.each { |u| u.add_role(Role::MEMBER, organization.primary_group) }
      org_guests.each { |u| u.add_role(Role::MEMBER, organization.guest_group) }
      other_org_users.each { |u| u.add_role(Role::MEMBER, other_org.primary_group) }
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'includes all active users in the organization, not including current user' do
      get(path)
      expect(json_object_ids).to match_array((org_users + org_guests).map(&:id))
    end
  end

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
      expect(user.last_active_at).to be_within(1.second).of(Time.current)
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
  end

  # describe 'GET #search', search: true do
  #   let!(:organization) { user.current_organization }
  #   let!(:users) { create_list(:user, 3) }
  #   let(:path) { '/api/v1/users/search' }
  #   let(:find_user) { users.first }
  #
  #   before do
  #     users.each do |member|
  #       member.add_role(:member, organization.primary_group)
  #     end
  #     User.reindex
  #   end
  #
  #   it 'returns a 200' do
  #     get(path, params: { query: '' })
  #     expect(response.status).to eq(200)
  #   end
  #
  #   it 'returns user that matches name search' do
  #     get(path, params: { query: find_user.name })
  #     expect(json['data'].size).to eq(1)
  #     expect(json['data'].first['id'].to_i).to eq(find_user.id)
  #   end
  #
  #   it 'returns user that matches fuzzy search' do
  #     name_without_first_char = find_user.name.slice(1, find_user.name.length)
  #     get(path, params: { query: name_without_first_char })
  #     expect(json['data'].size).to eq(1)
  #     expect(json['data'].first['id'].to_i).to eq(find_user.id)
  #   end
  #
  #   it 'returns user that matches email search' do
  #     get(path, params: { query: find_user.email })
  #     expect(json['data'].size).to eq(1)
  #     expect(json['data'].first['id'].to_i).to eq(find_user.id)
  #   end
  #
  #   it 'does not return fuzzy email match' do
  #     email_without_first_char = find_user.email.slice(1, find_user.email.length)
  #     get(path, params: { query: email_without_first_char })
  #     expect(json['data'].size).to eq(0)
  #   end
  #
  #   it 'returns empty array if no match' do
  #     get(path, params: { query: 'bananas' })
  #     expect(json['data']).to be_empty
  #   end
  #
  #   context 'with another org' do
  #     let!(:org2) { create(:organization) }
  #     let!(:org2_user) do
  #       create(:user,
  #              first_name: find_user.first_name,
  #              last_name: find_user.last_name)
  #     end
  #
  #     before do
  #       org2_user.add_role(:member, org2.primary_group)
  #       expect(org2_user.name).to eq(find_user.name)
  #       User.reindex
  #     end
  #
  #     it 'does not return user that has same name in another org' do
  #       get(path, params: { query: find_user.name })
  #       expect(json['data'].size).to eq(1)
  #       expect(json['data'].first['id'].to_i).to eq(find_user.id)
  #     end
  #   end
  # end

  describe 'POST #create_from_emails' do
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
        },
      }.to_json
    end

    before do
      user.update_attributes(terms_accepted: false, show_helper: true)
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

  describe 'POST #switch_org' do
    let!(:switch_organization) { create(:organization) }
    let!(:organization) { user.current_organization }
    let(:path) { '/api/v1/users/switch_org' }
    let(:params) { { organization_id: switch_organization.id.to_s }.to_json }
    let(:slug_params) { { organization_id: switch_organization.slug.to_s }.to_json }
    # catch a use case where we had an error using Organization.friendly.find
    let!(:bad_org) { create(:organization, slug: switch_organization.id) }

    before do
      organization.update(slug: 'sluggity-slug')
      switch_organization.update(slug: 'glug-2')
      user.add_role(Role::MEMBER, switch_organization.primary_group)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'it switches the users current org' do
      expect(user).to receive(:switch_to_organization).with(
        switch_organization,
      )
      post(path, params: params)
    end

    it 'it switches the users current org when using the slug' do
      expect(user).to receive(:switch_to_organization).with(
        switch_organization,
      )
      post(path, params: slug_params)
    end
  end
end
