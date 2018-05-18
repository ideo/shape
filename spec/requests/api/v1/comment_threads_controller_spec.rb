require 'rails_helper'

describe Api::V1::CommentThreadsController, type: :request, json: true, auth: true do
  describe 'GET #index' do
    let(:path) { '/api/v1/comment_threads' }
    let!(:comment_threads) { create_list(:item_comment_thread, 2, num_comments: 1) }

    before do
      get(path)
    end

    it 'returns a 200' do
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema for thread and comments' do
      expect(json['data'].first['attributes']).to match_json_schema('comment_thread')
      comment = json['included'].select{ |i| i['type'] == 'comments' }.first
      expect(comment['attributes']).to match_json_schema('comment')
    end
  end

  describe 'GET #show' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}" }

    before do
      get(path)
    end

    it 'returns a 200' do
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema for thread and comments' do
      expect(json['data']['attributes']).to match_json_schema('comment_thread')
      comment = json['included'].select{ |i| i['type'] == 'comments' }.first
      expect(comment['attributes']).to match_json_schema('comment')
    end
  end

  describe 'GET #find_by_record' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }
    let(:path) { "/api/v1/comment_threads/find_by_record/#{record_type}/#{record_id}" }

    before do
      get(path)
    end

    context 'with valid record' do
      let(:record_type) { 'Item' }
      let(:record_id) { comment_thread.record_id }

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        expect(json['data']['attributes']).to match_json_schema('comment_thread')
      end
    end

    context 'without valid record' do
      let(:record_type) { 'Collection' }
      let(:record_id) { 999999 }

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end
      it 'returns nil' do
        expect(json['data']).to be nil
      end
    end
  end

  describe 'POST #create' do
    let(:path) { "/api/v1/comment_threads" }
    let(:collection) { create(:collection) }
    let(:params) {
      json_api_params(
        'comment_threads',
        {
          record_id: collection.id,
          record_type: 'Collection'
        }
      )
    }

    before do
      post(path, params: params)
    end

    it 'returns a 200' do
      expect(response.status).to eq(200)
    end

    it 'creates a comment thread' do
      expect(json['data']['attributes']).to match_json_schema('comment_thread')
      expect(json['data']['attributes']['id']).not_to be nil
    end
  end
end
