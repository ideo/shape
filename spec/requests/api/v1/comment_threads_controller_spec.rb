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
end
