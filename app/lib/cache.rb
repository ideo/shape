# Wrapper for redis store

class Cache
  class_attribute :redis_client

  def self.client
    self.redis_client ||= Redis.new(url: ENV['REDIS_URL'])
  end


end
