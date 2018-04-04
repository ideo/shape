require 'rails_helper'

describe Api::V1::UsersController, type: :request, auth: true do
  let(:user) { @user }

  describe 'GET #index' do
    let!(:organization) { user.current_organization }
    let!(:org_users) { create_list(:user, 3) }
    let!(:other_org) { create(:organization) }
    let!(:other_org_users) { create_list(:user, 3) }
    let(:path) { "/api/v1/organizations/#{organization.id}/users" }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
      org_users.each { |u| u.add_role(Role::MEMBER, organization.primary_group) }
      other_org_users.each { |u| u.add_role(Role::MEMBER, other_org.primary_group) }
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'includes all users in the org' do
      get(path)
      expect(json_object_ids).to match_array(org_users.map(&:id))
    end

    context 'when added to content' do
      let!(:collection_users) { create_list(:user, 2) }
      let!(:collection_1) do
        create(:collection,
               organization: organization,
               add_editors: [user],
               add_viewers: [collection_users[0]])
      end
      let!(:collection_2) do
        create(:collection,
               organization: organization,
               add_editors: [collection_users[1]],
               add_viewers: [user])
      end
      let(:other_org_collection) do
        create(:collection,
               organization: other_org,
               add_editors: [other_org_users[1]],
               add_viewers: [user])
      end

      it 'includes all users also on that content' do
        get(path)
        expect(json_object_ids).to match_array((org_users + collection_users).map(&:id))
      end

      it 'does not include content that user belongs to in other org' do
        expect(other_org_collection.can_view?(user)).to be true
        get(path)
        expect(json_object_ids).to match_array((org_users + collection_users).map(&:id))
      end
    end

    context 'when added to groups' do
      let!(:group_users) { create_list(:user, 2) }
      let!(:group_1) do
        create(:group,
               organization: organization,
               add_admins: [group_users[0]],
               add_members: [user])
      end
      let!(:group_2) do
        create(:group,
               organization: organization,
               add_admins: [user],
               add_members: [group_users[1]])
      end
      let(:other_org_group) do
        create(:group,
               organization: other_org,
               add_admins: [user, other_org_users[0]])
      end

      it 'includes all users also in those groups' do
        get(path)
        expect(json_object_ids).to match_array((org_users + group_users).map(&:id))
      end

      it 'does not include groups from another org that user belongs to' do
        expect(other_org_group.can_view?(user)).to be true
        get(path)
        expect(json_object_ids).to match_array((org_users + group_users).map(&:id))
      end
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

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches User ID' do
      get(path)
      expect(json['data']['attributes']['id'].to_i).to eq(user.id)
      expect(assigns(:current_user)).to eq(user)
    end
  end

  describe '#GET #search', search: true do
    let!(:organization) { user.current_organization }
    let!(:users) { create_list(:user, 3) }
    let(:path) { '/api/v1/users/search' }
    let(:find_user) { users.first }

    before do
      users.each do |member|
        member.add_role(:member, organization.primary_group)
      end
      User.reindex
    end

    it 'returns a 200' do
      get(path, params: { query: '' })
      expect(response.status).to eq(200)
    end

    it 'returns user that matches name search' do
      get(path, params: { query: find_user.name })
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['id'].to_i).to eq(find_user.id)
    end

    it 'returns user that matches fuzzy search' do
      name_without_first_char = find_user.name.slice(1, find_user.name.length)
      get(path, params: { query: name_without_first_char })
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['id'].to_i).to eq(find_user.id)
    end

    it 'returns user that matches email search' do
      get(path, params: { query: find_user.email })
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['id'].to_i).to eq(find_user.id)
    end

    it 'does not return fuzzy email match' do
      email_without_first_char = find_user.email.slice(1, find_user.email.length)
      get(path, params: { query: email_without_first_char })
      expect(json['data'].size).to eq(0)
    end

    it 'returns empty array if no match' do
      get(path, params: { query: 'bananas' })
      expect(json['data']).to be_empty
    end

    context 'with another org' do
      let!(:org2) { create(:organization) }
      let!(:org2_user) do
        create(:user,
               first_name: find_user.first_name,
               last_name: find_user.last_name
               )
      end

      before do
        org2_user.add_role(:member, org2.primary_group)
        expect(org2_user.name).to eq(find_user.name)
        User.reindex
      end

      it 'does not return user that has same name in another org' do
        get(path, params: { query: find_user.name })
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['id'].to_i).to eq(find_user.id)
      end
    end
  end

  describe 'POST #create_from_emails' do
    let(:emails) { Array.new(3).map { Faker::Internet.email } }
    let(:users_json) { json_included_objects_of_type('users') }
    let(:path) { '/api/v1/users/create_from_emails' }
    let(:params) {
      {
        'emails': emails,
      }.to_json
    }

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
end
