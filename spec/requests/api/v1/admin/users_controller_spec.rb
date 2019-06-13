require 'rails_helper'

describe Api::V1::Admin::UsersController, type: :request, json: true, auth: true, create_org: true do
  let(:admin_user) { @user }

  before do
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #index' do
    let!(:non_admin_user) { create(:user) }
    let(:path) { '/api/v1/admin/users' }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns users with shape_admin role' do
      get(path)
      expect(json['data'].size).to eq(1)
      expect(json['data'][0]['id'].to_i).to eq(admin_user.id)
    end
  end

  describe 'DELETE #destroy' do
    let(:path) { "/api/v1/admin/users/#{admin_user.id}" }

    it 'returns a 204 no content' do
      delete(path)
      expect(response.status).to eq(204)
    end

    it 'removes the shape_admin role from the user' do
      delete(path)
      expect(admin_user.has_role?(Role::SHAPE_ADMIN)).to be(false)
    end
  end

  describe 'POST #create' do
    let(:path) { '/api/v1/admin/users' }
    let(:users) { create_list(:user, 3) }
    let(:user_ids) { users.map(&:id) }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:params) {
      {
        'user_ids': user_ids,
        'send_invites': true,
      }.to_json
    }

    it 'returns a 204 no content' do
      post(path, params: params)
      expect(response.status).to eq(204)
    end

    it 'adds the Shape admin role to the users' do
      allow(Admin::AddRoleToUsers).to receive(:call)
      post(path, params: params)
      expect(Admin::AddRoleToUsers).to have_received(:call).with(
        invited_by: admin_user,
        users: users,
        send_invites: true,
      )
    end
  end

  describe 'GET #search' do
    let(:audience) { create(:audience, age_list: ['millenial'], country_list: ['usa']) }
    let(:num_respondents) { 5 }
    let(:path) do
      "/api/v1/admin/users/search?audience_id=#{audience.id}&num_respondents=#{num_respondents}"
    end
    let(:test_collection1) { create(:test_collection) }
    let(:test_collection2) { create(:test_collection) }
    let(:test_audience1) do
      create(:test_audience,
             audience: audience,
             test_collection: test_collection1,
             sample_size: 10)
    end
    let(:test_audience2) do
      create(:test_audience,
             audience: audience,
             test_collection: test_collection2,
             sample_size: 10)
    end
    let!(:millenial_user) { create(:user, tag_list: ['millennial']) }
    let!(:usa_user) { create(:user, tag_list: ['usa']) }
    let!(:millenial_usa_user1) { create(:user, tag_list: %w[millenial usa]) }
    let!(:millenial_invitation1) do
      create(
        :test_audience_invitation,
        user: millenial_usa_user1,
        test_audience: test_audience1,
        created_at: Time.now - 2.days,
      )
    end
    let!(:millenial_usa_user2) { create(:user, tag_list: %w[millenial usa]) }
    let!(:millenial_invitation2) do
      create(
        :test_audience_invitation,
        user: millenial_usa_user2,
        test_audience: test_audience1,
        created_at: Time.now - 1.day,
      )
    end
    let!(:millenial_invitation3) do
      create(
        :test_audience_invitation,
        user: millenial_usa_user2,
        test_audience: test_audience2,
        created_at: Time.now,
      )
    end
    let!(:everything_user) { create(:user, tag_list: %w[millenial usa everything]) }

    it 'returns users tagged with the given audience tags' do
      get path

      expect(json['data'].size).to eq(3)

      actual_user_ids = json['data'].pluck('id')
      expected_user_ids = [
        everything_user.id.to_s,
        millenial_usa_user1.id.to_s,
        millenial_usa_user2.id.to_s,
      ]

      expect(actual_user_ids).to eq(expected_user_ids)
    end

    context 'with more users that match query than the desired number' do
      let(:num_respondents) { 2 }

      it 'limits number of users returned to the desired number given' do
        get path

        expect(json['data'].size).to eq(2)

        actual_user_ids = json['data'].pluck('id')
        expected_user_ids = [
          everything_user.id.to_s,
          millenial_usa_user1.id.to_s,
        ]

        expect(actual_user_ids).to eq(expected_user_ids)
      end
    end
  end
end
