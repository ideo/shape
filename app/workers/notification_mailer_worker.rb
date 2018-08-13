require 'sidekiq-scheduler'

class NotificationMailerWorker
  include Sidekiq::Worker

  def perform
    puts 'Sending notification emails'
    # timeframe will just look up users that have any notifications in the last 5 hours,
    # but the service will only look up the relevant new notifications
    NotificationDigest.call(type: :notifications, timeframe: 5.hours.ago)
  end
end
