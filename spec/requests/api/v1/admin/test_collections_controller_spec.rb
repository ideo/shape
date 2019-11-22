require 'rails_helper'

describe Api::V1::Admin::TestCollectionsController, type: :request, json: true, auth: true do
  let(:admin_user) { @user }

  before do
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #index' do
    let!(:collection) { create(:test_collection, test_status: :live, test_launched_at: Time.now) }
    let!(:targeted_audience) { create(:audience) }
    let!(:link_share_audience) { create(:audience, :link_sharing) }
    let!(:test_audience) do
      create(
        :test_audience,
        audience: targeted_audience,
        test_collection: collection,
        price_per_response: 4.50,
      )
    end
    let!(:survey_response) do
      create(
        :survey_response,
        status: :completed,
        test_collection: collection,
        test_audience: test_audience,
        user: admin_user,
      )
    end
    let!(:draft_collection) { create(:test_collection, test_status: :draft) }
    let!(:collection_without_test_audience) { create(:test_collection, test_status: :live) }
    let!(:collection_with_link_share_test_audience) { create(:test_collection, test_status: :live) }
    let!(:link_share_test_audience) do
      create(
        :test_audience,
        audience: link_share_audience,
        test_collection: collection_with_link_share_test_audience,
        price_per_response: 0,
      )
    end
    let(:path) { '/api/v1/admin/test_collections?page=1' }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns launched test collections' do
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

    it 'returns test audiences' do
      get(path)

      actual_test_audience = json['included'][0]
      expect(actual_test_audience['id'].to_i).to eq(test_audience.id)
      expect(actual_test_audience['attributes']['sample_size']).to eq(test_audience.sample_size)
      expect(actual_test_audience['attributes']['num_completed_responses']).to eq(1)

      actual_audience = json['included'][1]
      expect(actual_audience['id'].to_i).to eq(targeted_audience.id)
      expect(actual_audience['attributes']['name']).to eq(targeted_audience.name)
    end

    it 'paginates' do
      get(path)

      expect(response.header['X-Total-Pages']).to eq(1)
    end
  end
end
