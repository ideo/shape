class ChannelPresenceTracker
  CACHE_KEY = 'channel_subcriptions'.freeze
  cattr_accessor :redis_client

  def self.client
    self.redis_client ||= Redis.new(url: ENV['REDIS_URL'])
  end

  def self.current_subscriptions
    client.smembers(CACHE_KEY)
  end

  def self.track(channel_name, user_id)
    client.sadd(CACHE_KEY, "#{channel_name}-#{user_id}")
  end

  def self.untrack(channel_name, user_id)
    client.srem(CACHE_KEY, "#{channel_name}-#{user_id}")
  end
end
