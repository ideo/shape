if ENV['REDIS_URL'].present?
  $REDIS = Redis.new(url: ENV['REDIS_URL'])
end
