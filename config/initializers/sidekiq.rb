Sidekiq.configure_server do |config|
  config.redis = { url: ENV['REDIS_URL'] || ENV['REDISCLOUD_URL'] || 'redis://localhost:6379/0' }
end
