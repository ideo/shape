require 'rails_helper'

describe Api::V1::TagsController, type: :request, json: true, auth: false, api_token: true do
  let(:current_user) { @user }
  let(:application) { @api_token&.application }

  describe 'GET #index' do
    let!(:tags) { create_list(:tag, 3, application: application) }
    let(:path) { api_v1_tags_path }

    it 'returns a 200' do
      get(path, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(response.status).to eq(200)
    end

    it 'returns expected tags' do
      get(path, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(json_object_ids).to match_array(tags.map(&:id))
    end

    it 'filters tag that match name' do
      get(
        path,
        params: { filter: { name: tags[0].name } },
        headers: { Authorization: "Bearer #{@api_token.token}" },
      )
      expect(json_object_ids).to eq([tags[0].id])
    end

    context 'with user auth', auth: true, api_token: false do
      let!(:organization) { create(:organization, admin: current_user) }
      let!(:user_tags) { create_list(:tag, 3, organization_ids: [organization.id]) }

      it 'returns the tags' do
        get(path)
        expect(response.status).to eq(200)
        expect(json_object_ids).to match_array(user_tags.map(&:id))
      end
    end
  end

  describe 'GET #show' do
    let(:tag) { create(:tag, application: application) }
    let(:path) { api_v1_tag_path(tag) }

    it 'returns 200' do
      get(path, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(json['data']['attributes']).to match_json_schema('tag')
    end
  end

  describe 'POST #create' do
    let(:path) { api_v1_tags_path }
    let(:params) do
      json_api_params(
        'tags',
        name: 'Experimentation',
        color: '#D26A3B',
      )
    end

    it 'returns a 200' do
      post(path, params: params, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(response.status).to eq(200)
    end

    it 'creates new tag linked to app' do
      expect {
        post(path, params: params, headers: { Authorization: "Bearer #{@api_token.token}" })
      }.to change(ActsAsTaggableOn::Tag, :count).by(1)
    end
  end

  describe 'PATCH #update' do
    let(:tag) { create(:tag, application: application) }
    let(:params) do
      json_api_params(
        'tags',
        color: '#CC0000',
      )
    end
    let(:path) { api_v1_tag_path(tag) }

    it 'returns a 200' do
      patch(path, params: params, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(json['data']['attributes']).to match_json_schema('tag')
    end

    it 'updates the content' do
      expect(tag.color).not_to eq('#CC0000')
      patch(path, params: params, headers: { Authorization: "Bearer #{@api_token.token}" })
      expect(tag.reload.color).to eq('#CC0000')
    end
  end
end
