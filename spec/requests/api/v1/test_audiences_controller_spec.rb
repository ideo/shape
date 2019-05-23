require 'rails_helper'

describe Api::V1::TestAudiencesController, type: :request, json: true, auth: true do
  let(:payment_method_double) { double(id: SecureRandom.hex(10)) }
  let(:network_payment_double) { double(id: 5, status: 'succeeded') }

  before do
    @user = current_user
    allow(NetworkApi::Payment).to receive(:create).and_return(
      network_payment_double,
    )
    allow(NetworkApi::PaymentMethod).to receive(:find).and_return(
      [payment_method_double],
    )
  end

  describe 'POST #create', :vcr do
    let!(:current_user) { @user }
    let(:organization) { create(:organization, admin: current_user) }
    let(:audience) { create(:audience, organization: organization) }
    let(:test_collection) { create(:test_collection, add_editors: [current_user]) }
    let(:params) do
      json_api_params(
        'test_audiences',
        'audience_id': audience.id,
        'test_collection_id': test_collection.id,
        'sample_size': 5,
      )
    end
    let(:path) { '/api/v1/test_audiences/' }

    before do
      @user = current_user
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('test_audience')
    end

    it 'saves the survey response' do
      expect { post(path, params: params) }.to change(TestAudience, :count).by(1)
    end
  end

  describe 'PATCH #update', :vcr do
    let!(:current_user) { @user }
    let(:organization) { create(:organization, admin: current_user) }
    let(:audience) { create(:audience, organization: organization) }
    let(:test_collection) { create(:test_collection, add_editors: [current_user]) }
    let(:network_organization_double) { double(id: SecureRandom.hex(10)) }
    let(:test_audience) do
      create(:test_audience,
             audience: audience,
             test_collection: test_collection,
             sample_size: 10,
             launched_by: current_user)
    end
    let(:params) do
      json_api_params(
        'test_audiences',
        'audience_id': audience.id,
        'test_collection_id': test_collection.id,
        'sample_size': 15,
      )
    end
    let(:path) { "/api/v1/test_audiences/#{test_audience.id}" }

    before do
      @user = current_user
      allow(NetworkApi::Organization).to receive(:find_by_external_id).and_return(
        network_organization_double,
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('test_audience')
    end

    it 'saves the survey response' do
      expect { patch(path, params: params) }.to change(TestAudience, :count).by(1)
    end
  end
end
