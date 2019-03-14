class LogChannelSubscribersWorker
  include Sidekiq::Worker

  def perform
    create_app_metrics
  end

  private

  def create_app_metrics
    get_subscriptions_by_channel.each do |channel_name, count|
      AppMetric.create(
        metric: "subscribers-#{channel_name}",
        value: count,
      )
    end
  end

  def get_subscriptions_by_channel
    subscriptions = ChannelPresenceTracker.current_subscriptions
    subscriptions.each_with_object({}) do |key, h|
      channel_key, user_id = key.to_s.split('-')
      h[channel_key] ||= 0
      h[channel_key] += 1
    end
  end
end
