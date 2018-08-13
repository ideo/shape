require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  describe '#invite' do
    let(:user) { create(:user) }
    let!(:notifications) { [create(:notification, user: user)] }
    let!(:comment_threads) { create_list(:collection_comment_thread, 2, add_followers: [user]) }
    let(:mail) do
      NotificationMailer.notify(
        user_id: user.id,
        notification_ids: notifications.map(&:id),
        comment_thread_ids: comment_threads.map(&:id),
      )
    end

    it 'renders the headers' do
      expect(mail.subject).to match("#{notifications.count} new notifications on Shape")
      expect(mail.to).to eq([user.email])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match(
        'Your collaborators and teammates have updates for you. ' \
        "Check out what's been going on since you've been gone!",
      )
    end

    it 'should update the last_notification_mail_sent timestamp' do
      expect {
        mail.deliver_now
        user.reload
      }.to change(user, :last_notification_mail_sent)
      expect(user.last_notification_mail_sent).to be >= 1.minute.ago
    end
  end
end
