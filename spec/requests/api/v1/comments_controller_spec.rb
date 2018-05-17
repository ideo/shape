require 'rails_helper'

describe Api::V1::CommentsController, type: :request, json: true, auth: true do
  describe 'POST #create' do
    let!(:comment_thread) { create(:item_comment_thread) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}/comments" }
    let(:params) { { message: 'heyo' }.to_json }

    before do
      post(path, params: params)
    end

    it 'returns a 200' do
      expect(response.status).to eq(200)
    end

    it 'creates a message in the thread' do
      expect(comment_thread.comments.count).to eq(1)
      expect(comment_thread.comments.first.message).to eq('heyo')
    end
  end
end
