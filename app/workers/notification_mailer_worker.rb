require 'sidekiq-scheduler'

class NotificationMailerWorker
  include Sidekiq::Worker

  def perform
    puts 'Sending notification emails'
    NotificationDigest.call(type: :notifications, timeframe: 6.hours.ago)
  end
end
