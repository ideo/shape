require 'rails_helper'

describe Api::V1::CommentThreadsController, type: :request, json: true, auth: true do
  describe 'GET #index' do
    let(:path) { '/api/v1/comment_threads' }
    let!(:comment_threads) { create_list(:item_comment_thread, 2, num_comments: 1) }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data'].first['attributes']).to match_json_schema('comment_thread')
      comment = json['included'].select{ |i| i['type'] == 'comments' }.first
      expect(comment['attributes']).to match_json_schema('comment')
    end
  end
end
