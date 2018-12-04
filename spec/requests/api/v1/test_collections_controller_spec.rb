require 'rails_helper'

describe Api::V1::TestCollectionsController, type: :request, json: true, auth: true do
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
        expect(response.status).to eq(400)
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
end
