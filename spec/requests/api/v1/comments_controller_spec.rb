require 'rails_helper'

describe Api::V1::CommentsController, type: :request, json: true, auth: true do
  let(:user) { @user }
  describe 'GET #index' do
    let!(:comment_thread) do
      create(:item_comment_thread, num_comments: 3, add_followers: [user])
    end
    let(:users_thread) { user.users_threads.first }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}/comments" }

    before do
      user.add_role(Role::VIEWER, comment_thread.record)
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'marks thread as read' do
      get(path)
      expect(users_thread.reload.last_viewed_at).not_to be nil
    end
  end

  describe 'POST #create' do
    let!(:comment_thread) { create(:item_comment_thread) }
    let(:path) { "/api/v1/comment_threads/#{comment_thread.id}/comments" }
    let(:params) { { message: 'heyo' }.to_json }
    let(:instance_double) do
      double('ActivityAndNotificationBuilder')
    end

    before do
      allow(ActivityAndNotificationBuilder).to receive(:new).and_return(instance_double)
      allow(instance_double).to receive(:call).and_return(true)
      user.add_role(Role::EDITOR, comment_thread.record)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'creates a message in the thread' do
      post(path, params: params)
      expect(comment_thread.comments.count).to eq(1)
      expect(comment_thread.comments.first.message).to eq('heyo')
    end

    it 'creates an activity and notifications for the content' do
      expect(ActivityAndNotificationBuilder).to receive(:new).with(
        actor: @user,
        target: comment_thread.record,
        action: Activity.actions[:commented],
        subject_users: [user],
        subject_groups: [],
        combine: true,
        content: 'heyo',
      )
      post(path, params: params)
    end
  end
end
