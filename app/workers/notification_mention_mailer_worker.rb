require 'sidekiq-scheduler'

class NotificationMentionMailerWorker
  include Sidekiq::Worker

  def perform
    puts 'Sending mention notification emails'
    NotificationDigest.call(type: :mentions, timeframe: 10.minutes.ago)
  end
end
