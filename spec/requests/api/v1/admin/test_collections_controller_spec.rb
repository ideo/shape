require 'rails_helper'

describe Api::V1::Admin::TestCollectionsController, type: :request, json: true, auth: true do
  let(:admin_user) { @user }

  before do
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #index' do
    let!(:collection) { create(:test_collection, test_status: :live, test_launched_at: Time.now) }
    let(:path) { "/api/v1/admin/test_collections" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns test collections' do
      get(path)
      expect(json['data'].size).to eq(1)
    end

    it 'uses custom serializer' do
      get(path)

      actual_test_collection = json['data'][0]
      expect(actual_test_collection['id'].to_i).to eq(collection.id)
      expect(actual_test_collection['attributes']['name']).to eq(collection.name)
      expect(actual_test_collection['attributes']['test_launched_at']).not_to be_nil
    end
  end
end
