require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  describe '#notify' do
    describe 'when there are no notifications or comments' do
      let!(:notifications) { [] }
      let!(:comment_threads) { [] }
      let!(:comments) { [] }

      it 'mailer returns early and does not execute #mail' do
        allow(NotificationMailer).to receive(:notify).and_return(nil)
      end
    end

    describe 'when there are comments or notifications' do
      let(:user) { create(:user, last_notification_mail_sent: 1.day.ago) }
      let!(:notifications) { [create(:notification, user: user)] }
      let!(:comment_threads) { create_list(:collection_comment_thread, 2, add_followers: [user]) }
      let!(:comments) do
        create_list(:comment, 2, comment_thread_id: comment_threads.first.id, author_id: user.id)
      end
      let(:mail) do
        NotificationMailer.notify(
          user_id: user.id,
          notification_ids: notifications.map(&:id),
          comment_thread_ids: comment_threads.map(&:id),
        )
      end

      it 'renders the body' do
        expect(mail.body.encoded).to match(
          'Your collaborators and teammates have updates for you.',
        )
      end

      describe 'with added editor activity' do
        let(:collection) { create(:collection) }
        let(:activity) { create(:activity, subject_users: [user], action: :added_editor, target: collection) }
        let!(:notifications) { [create(:notification, user: user, activity: activity)] }

        it 'renders added editor user' do
          expect(mail.body.encoded).to include(
            "#{notifications.first.activity.actor.name} has made #{notifications.first.activity.subject_users.first.name} a(n) editor of",
          )
        end

        context 'with group' do
          let(:group) { create(:group) }
          let!(:activity) { create(:activity, subject_groups: [group], action: :added_editor, target: collection) }

          it 'renders added editor group' do
            expect(mail.body.encoded).to include(
              "#{notifications.first.activity.actor.name} has made #{notifications.first.activity.subject_groups.first.name} a(n) editor of",
            )
          end
        end
      end

      it 'should update the last_notification_mail_sent timestamp' do
        expect {
          mail.deliver_now
          user.reload
        }.to change(user, :last_notification_mail_sent)
        expect(user.last_notification_mail_sent).to be >= 1.minute.ago
      end

      describe 'when there are no comments created after the last notification was sent' do
        let!(:user) { create(:user, last_notification_mail_sent: 1.day.ago) }

        before do
          comment_threads.each do |th|
            th.update(updated_at: 1.day.ago)
            th.reload
            th.comments.update_all(created_at: 2.days.ago)
          end
        end

        it 'does not render comments even when comment threads were recently updated' do
          expect(mail.body.encoded).not_to match 'New comments'
        end

        context 'with one comment created after the notification was sent' do
          let(:new_comment) { create(:comment, comment_thread: comment_threads.first, author: user) }
          before do
            comment_threads.first.comments << new_comment
          end

          it 'renders new comment' do
            expect(mail.body.encoded).to match 'New comments'
            expect(mail.body.encoded).to match comment_threads.first.record.name.to_s
            expect(mail.body.encoded).to match new_comment.author.name.to_s
          end
        end
      end

      describe 'when there are notifications and comments' do
        it 'renders the headers' do
          expect(mail.subject).to match("#{comments.count} new comments and #{notifications.count} new notifications on Shape")
          expect(mail.to).to eq([user.email])
        end
      end

      describe 'when there are only notifications and no new comments' do
        it 'renders the headers' do
          expect(mail.subject).to match("#{notifications.count} new notifications on Shape")
          expect(mail.to).to eq([user.email])
        end
      end

      describe 'when there are only comments' do
        let!(:notifications) { [] }

        it 'renders the headers' do
          expect(mail.subject).to match("#{comments.count} new comments on Shape")
          expect(mail.to).to eq([user.email])
        end
      end
    end
  end
end
