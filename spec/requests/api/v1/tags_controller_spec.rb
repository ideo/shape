require 'rails_helper'

describe Api::V1::TagsController, type: :request, json: true, auth: true do
  let(:current_user) { @user }


  describe 'GET #index' do
    let(:organization) { create(:organization, member: @user) }
    let!(:tags) { create_list(:tag, 3, organization_ids: [organization.id]) }
    let!(:tag_not_in_org) { create(:tag) }
    let(:path) { api_v1_organization_tags_path(organization) }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns expected tags' do
      get(path)
      expect(json_object_ids).to match_array(tags.map(&:id))
    end
  end
end
