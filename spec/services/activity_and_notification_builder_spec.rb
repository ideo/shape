require 'rails_helper'

RSpec.describe ActivityAndNotificationBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:actor) { create(:user, add_to_org: organization) }
  let(:target_parent) { create(:collection, organization: organization) }
  let(:target) { create(:collection, parent_collection: target_parent) }
  let(:action) { :archived }
  let(:subject_users) { create_list(:user, 1) }
  let(:subject_groups) { [] }
  let(:omit_user_ids) { [] }
  let(:omit_group_ids) { [] }
  let(:combine) { false }
  let(:content) { nil }
  let(:source) { nil }
  let(:destination) { nil }
  let(:async) { false }
  let(:builder) do
    ActivityAndNotificationBuilder.new(
      actor: actor,
      target: target,
      action: action,
      subject_user_ids: subject_users.map(&:id),
      subject_group_ids: subject_groups.map(&:id),
      omit_user_ids: omit_user_ids,
      omit_group_ids: omit_group_ids,
      combine: combine,
      content: content,
      source: source,
      destination: destination,
      async: async,
    )
  end
  let!(:comment_thread) { create(:collection_comment_thread, record: target) }
  let!(:users_thread) { create(:users_thread, comment_thread: comment_thread, user: subject_users[0], subscribed: true) }

  before do
    target.reload
  end

  describe '#call' do
    context 'with no actor' do
      # e.g. current_user.nil?
      let(:actor) { nil }

      it 'returns false' do
        expect { builder.call }.not_to change(Activity, :count)
        expect(builder.call).to be false
      end
    end

    it 'creates one new activity' do
      expect { builder.call }.to change(Activity, :count).by(1)
    end

    it 'calls CreateActivityNotificationsWorker' do
      # TODO: could rename/refactor this if we ever have ActivityAndNotificationBuilder be async by default
      expect(CreateActivityNotificationsWorker).to receive(:perform_async).with(
        anything,
        omit_user_ids,
        omit_group_ids,
        combine,
      )
      builder.call
    end

    it 'caches the activity count on the target' do
      expect {
        builder.call
      }.to change(target, :cached_activity_count)
    end

    it 'reindexes the activity count' do
      expect(Collection).to receive(:reindex_async).with([target_parent.id, target.id])
      builder.call
    end

    context 'with multiple users' do
      let(:subject_users) { create_list(:user, 2) }

      before do
        subject_users.each do |user|
          next if user.users_threads.any?

          create(:users_thread,
                 comment_thread: comment_thread,
                 user: user,
                 subscribed: true)
        end
      end

      it 'creates activity subjects for each user' do
        expect { builder.call }.to change(ActivitySubject, :count).by(2)
      end

      context 'with action that does not notify' do
        let(:action) { :edited }

        it 'does not create notifications' do
          expect(CreateActivityNotificationsWorker).not_to receive(:perform_async)
          builder.call
        end
      end

      context 'with action that does not have subjects' do
        let(:action) { :downloaded }

        it 'does not create activity subjects' do
          expect { builder.call }.not_to change(ActivitySubject, :count)
        end
      end
    end

    context 'when a subject user is also the actor' do
      let(:subject_users) { [actor] }

      it 'should not notify you if you are the actor' do
        builder.call
        expect { builder.call }.to change(Notification, :count).by(0)
      end
    end

    context 'with content' do
      let!(:content) { 'hello content' }

      it 'adds the content to the activity' do
        builder.call
        expect(Activity.last.content).to eq('hello content')
      end
    end

    context 'with source and destination' do
      let!(:source) { create(:collection) }
      let!(:destination) { create(:collection) }

      it 'adds the content to the activity' do
        builder.call
        expect(Activity.last.source).to eq(source)
        expect(Activity.last.destination).to eq(destination)
      end
    end

    context 'with async' do
      let(:async) { true }

      it 'calls ActivityAndNotificationWorker' do
        expect(ActivityAndNotificationWorker).to receive(:perform_async)
        builder.call
      end
    end
  end
end
