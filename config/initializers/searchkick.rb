Searchkick.redis = ConnectionPool.new { Redis.new(url: ENV['REDIS_URL']) }
