require 'rails_helper'

describe Api::V1::TestCollectionsController, type: :request, json: true, auth: true do
  include IdeoSsoHelper
  let(:user) { @user }

  describe 'GET #show' do
    let!(:collection) { create(:test_collection, test_status: :live) }
    let(:path) { "/api/v1/test_collections/#{collection.id}" }

    it 'returns a 200 without authorizing the user' do
      get(path)
      expect(response.status).to eq(200)
    end
  end

  describe 'PATCH #launch' do
    let(:path) { "/api/v1/test_collections/#{collection.id}/launch" }

    context 'with an already live test collection' do
      let!(:collection) { create(:test_collection, test_status: :live, add_editors: [user]) }

      it 'should not allow the launch action' do
        patch(path)
        expect(response.status).to eq(422)
      end
    end

    context 'with a draft, ready test collection' do
      let!(:collection) { create(:test_collection, :completed, test_status: :draft, add_editors: [user]) }

      it 'should allow the launch action' do
        patch(path)
        expect(response.status).to eq(200)
      end

      it 'should call the launch method on the collection' do
        patch(path)
        expect(collection.reload.test_status).to eq 'live'
      end
    end

    context 'with a non-test collection' do
      let!(:collection) { create(:collection, add_editors: [user]) }

      it 'returns a 404' do
        patch(path)
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'PATCH #close' do
    let(:path) { "/api/v1/test_collections/#{collection.id}/close" }

    context 'with an already live test collection' do
      let!(:collection) { create(:test_collection, test_status: :live, add_editors: [user]) }

      it 'should allow the close action' do
        patch(path)
        expect(response.status).to eq(200)
      end

      it 'should call the close! method on the collection' do
        patch(path)
        expect(collection.reload.test_status).to eq 'closed'
      end
    end
  end

  describe 'PATCH #reopen' do
    let(:path) { "/api/v1/test_collections/#{collection.id}/reopen" }

    context 'with an already closed test collection' do
      let!(:collection) { create(:test_collection, :completed, add_editors: [user]) }

      before do
        # make sure the test_design is set up, otherwise `can_reopen?` will be false
        collection.launch!(initiated_by: user)
        collection.close!
      end

      it 'should allow the reopen action' do
        patch(path)
        expect(response.status).to eq(200)
      end

      it 'should call the reopen! method on the collection' do
        patch(path)
        expect(collection.reload.test_status).to eq 'live'
      end
    end
  end

  describe 'POST #add_comparison' do
    let!(:collection) { create(:test_collection, test_status: :live, add_editors: [user]) }
    let!(:comparison_collection) { create(:test_collection, test_status: :live, add_editors: [user]) }
    let(:path) do
      add_comparison_api_v1_test_collection_path(collection)
    end
    let(:params) do
      {
        data: {
          comparison_collection_id: comparison_collection.id,
        },
      }.to_json
    end
    before do
      allow(
        TestComparison,
      ).to receive(:new).and_return(test_comparison_instance)
    end

    context 'if add succeeds' do
      let(:test_comparison_instance) { double(add: true) }

      it 'calls TestComparison.add' do
        expect(test_comparison_instance).to receive(:add)
        post(path, params: params)
        expect(response.status).to eq(200)
      end
    end

    context 'if add fails' do
      let(:test_comparison_instance) { double(add: false, errors: ['Bad things']) }

      it 'returns errors' do
        expect(test_comparison_instance).to receive(:add)
        post(path, params: params)
        expect(response.status).to eq(422)
      end
    end
  end

  describe 'POST #remove_comparison' do
    let!(:collection) { create(:test_collection, test_status: :live) }
    let!(:comparison_collection) { create(:test_collection, test_status: :live, add_editors: [user]) }
    let(:path) do
      remove_comparison_api_v1_test_collection_path(collection)
    end
    let(:params) do
      {
        data: { comparison_collection_id: comparison_collection.id },
      }.to_json
    end
    before do
      allow(
        TestComparison,
      ).to receive(:new).and_return(test_comparison_instance)
    end

    context 'if add succeeds' do
      let(:test_comparison_instance) { double(remove: true) }

      it 'calls TestComparison.remove' do
        expect(test_comparison_instance).to receive(:remove)
        post(path, params: params)
        expect(response.status).to eq(200)
      end
    end

    context 'if TestComparison.remove fails' do
      let(:test_comparison_instance) { double(remove: false, errors: ['Bad things']) }

      it 'returns errors' do
        expect(test_comparison_instance).to receive(:remove)
        post(path, params: params)
        expect(response.status).to eq(422)
      end
    end
  end

  describe 'GET #csv_report' do
    let!(:collection) { create(:test_collection, test_status: :live, add_editors: [user]) }
    let(:path) do
      csv_report_api_v1_test_collection_path(collection)
    end

    it 'should call TestCollection::ExportToCsv to generate report' do
      expect(TestCollection::ExportToCsv).to receive(:call).with(collection)
      get(path)
    end
  end
end
