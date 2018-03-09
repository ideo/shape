require 'rails_helper'

describe Api::V1::UsersController, type: :request, auth: true do
  describe 'GET #show' do
    let!(:user) { create(:user) }
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

  describe '#GET #search', search: true do
    let!(:organization) { create(:organization) }
    let(:current_user) { @user }
    let!(:users) { create_list(:user, 3) }
    let(:path) { '/api/v1/users/search' }
    let(:find_user) { users.first }

    before do
      current_user.add_role(:member, organization.primary_group)
      users.each do |user|
        user.add_role(:member, organization.primary_group)
      end
      User.reindex
    end

    it 'returns a 200' do
      get(path, params: { query: '' })
      expect(response.status).to eq(200)
    end

    it 'returns user that matches name search' do
      get(path, params: { query: find_user.name })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(find_user.id)
    end

    it 'returns user that matches email search' do
      get(path, params: { query: find_user.email })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(find_user.id)
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
      end

      it 'does not return user that has same name in another org' do
        get(path, params: { query: find_user.name })
        expect(json['data'].size).to be(1)
        expect(json['data'].first['id'].to_i).to eq(find_user.id)
      end
    end
  end
end
