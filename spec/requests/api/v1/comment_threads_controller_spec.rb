require 'rails_helper'

describe Api::V1::CommentThreadsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #index', create_org: true do
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
    let(:record_type) { 'Item' }
    let(:record_id) { comment_thread.record_id }
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }
    let(:path) { "/api/v1/comment_threads/find_by_record/#{record_type}/#{record_id}" }

    before do
      # default to user `current_organization` when none is passed in
      user.update(current_organization_id: comment_thread.organization_id)
      user.add_role(Role::EDITOR, comment_thread.record)
      get(path)
    end

    context 'with valid record' do
      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        expect(json['data']['attributes']).to match_json_schema('comment_thread')
        expect(json['data']['id']).to eq(comment_thread.id.to_s)
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

    context 'without matching organization' do
      let(:path) { "/api/v1/comment_threads/find_by_record/#{record_type}/#{record_id}?organization_id=9999" }

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end
      it 'returns nil' do
        expect(json['data']).to be nil
      end
    end

    context 'with multiple organizations' do
      let(:org_2) { create(:organization_without_groups) }
      let!(:comment_thread_2) do
        create(:item_comment_thread, num_comments: 1, record: comment_thread.record, organization_id: org_2.id)
      end
      let(:path) { "/api/v1/comment_threads/find_by_record/#{record_type}/#{record_id}?organization_id=#{org_2.id}" }

      before do
        user.add_role(Role::EDITOR, comment_thread_2.record)
        get(path)
      end

      it 'finds the comment thread for that organization' do
        expect(response.status).to eq(200)
        expect(json['data']['id']).to eq(comment_thread_2.id.to_s)
      end
    end
  end

  describe 'GET #find_by_comment', only: true do
    let(:record_type) { 'Item' }
    let(:record_id) { comment_thread.record_id }
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }
    let(:comment) { comment_thread.comments.first }
    let(:comment_id) { comment.id }
    let(:path) { "/api/v1/comment_threads/find_by_comment/#{comment_id}" }

    before do
      # default to user `current_organization` when none is passed in
      user.update(current_organization_id: comment_thread.organization_id)
      user.add_role(Role::EDITOR, comment_thread.record)
      get(path)
    end

    context 'with valid record' do
      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        expect(json['data']['attributes']).to match_json_schema('comment_thread')
        expect(json['data']['id']).to eq(comment_thread.id.to_s)
      end
    end

    context 'without valid record' do
      let(:comment_id) { 999_999 }

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
    let(:params) do
      json_api_params(
        'comment_threads',
        record_id: collection.id,
        record_type: 'Collection',
      )
    end

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
        expect(json['data']['id']).not_to be nil
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

  describe 'PATCH #subscribe' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1, add_followers: [user]) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}/subscribe" }

    before do
      user.add_role(Role::EDITOR, comment_thread.record)
    end

    context 'with pre-existing users_thread' do
      before do
        comment_thread.users_thread_for(user).update(subscribed: false)
      end

      it 'returns a 200' do
        patch(path, params: {})
        expect(response.status).to eq(200)
      end

      it 'sets subscribed on the user thread to true' do
        patch(path, params: {})
        expect(comment_thread.users_thread_for(user).subscribed).to be true
      end

      it 'updates firestore' do
        expect_any_instance_of(CommentThread).to receive(:update_firestore_users_threads)
        patch(path, params: {})
      end
    end

    context 'with no pre-existing users_thread' do
      let!(:comment_thread) { create(:item_comment_thread, num_comments: 1) }

      it 'returns a 200' do
        patch(path, params: {})
        expect(response.status).to eq(200)
      end

      it 'creates a user thread with subscribed == true' do
        expect(comment_thread.users_thread_for(user)).to be nil
        patch(path, params: {})
        expect(comment_thread.users_thread_for(user).subscribed).to be true
      end
    end
  end

  describe 'PATCH #unsubscribe' do
    let!(:comment_thread) { create(:item_comment_thread, num_comments: 1, add_followers: [user]) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}/unsubscribe" }

    before do
      user.add_role(Role::EDITOR, comment_thread.record)
      comment_thread.users_thread_for(user).update(subscribed: true)
    end

    it 'returns a 200' do
      patch(path, params: {})
      expect(response.status).to eq(200)
    end

    it 'sets subscribed on the user thread to true' do
      patch(path, params: {})
      expect(comment_thread.users_thread_for(user).subscribed).to be false
    end

    it 'updates firestore' do
      expect_any_instance_of(CommentThread).to receive(:update_firestore_users_threads)
      patch(path, params: {})
    end
  end
end
