require 'rails_helper'

describe Api::V1::CommentThreadsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #index' do
    let(:path) { '/api/v1/comment_threads' }
    let!(:comment_threads) do
      create_list(
        :collection_comment_thread,
        2,
        add_followers: [user],
        num_comments: 1,
        organization: user.current_organization,
      )
    end

    before do
      # set user last_viewed_at in the past so there will be unread comments
      comment_threads.first.users_threads.first.update(last_viewed_at: 1.day.ago)
      get(path)
    end

    it 'returns a 200' do
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema for thread' do
      expect(json['data'].first['attributes']).to match_json_schema('comment_thread')
    end
  end

  describe 'GET #show' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1, add_followers: [user]) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}" }

    context 'with access to record' do
      before do
        # set user last_viewed_at in the past so there will be unread comments
        comment_thread.users_threads.first.update(last_viewed_at: 1.day.ago)
        user.add_role(Role::EDITOR, comment_thread.record)
        get(path)
      end

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema for thread' do
        expect(json['data']['attributes']).to match_json_schema('comment_thread')
      end
    end

    context 'without access to record' do
      before do
        get(path)
      end

      it 'returns a 401' do
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'GET #find_by_record' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }
    let(:path) { "/api/v1/comment_threads/find_by_record/#{record_type}/#{record_id}" }

    before do
      user.add_role(Role::EDITOR, comment_thread.record)
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
      let(:record_id) { 999_999 }

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end
      it 'returns nil' do
        expect(json['data']).to be nil
      end
    end
  end

  describe 'POST #create' do
    let(:path) { '/api/v1/comment_threads' }
    let(:collection) { create(:collection) }
    let(:params) {
      json_api_params(
        'comment_threads',
        record_id: collection.id,
        record_type: 'Collection',
      )
    }

    context 'with access to record' do
      before do
        user.add_role(Role::VIEWER, collection)
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

    context 'without access to record' do
      before do
        post(path, params: params)
      end

      it 'returns a 401' do
        expect(response.status).to eq(401)
      end
    end
  end
end
