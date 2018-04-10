# Wrapper for redis store

class Cache
  class_attribute :redis_client

  def self.client
    self.redis_client ||= Redis.new(url: ENV['REDIS_URL'])
  end

  def self.set(key, value, expires_in = nil, raw = false)
    value = JSON.generate(value) unless raw
    result = client.set(key, value) == 'OK'
    client.expire(key, expires_in.to_i) if result and expires_in.present?
    result
  end

  def self.get(key, raw = false)
    value = client.get(key)
    value = JSON.parse(value) unless value.blank? or raw
    value
  end

  def self.delete(key)
    client.del(key) == '1'
  end

  def self.set_add(key, value)
    client.sadd(key, value) == '1'
  end

  def self.set_members(key)
    client.smembers(key)
  end

  def self.set_member?(key, value)
    client.sismember(key, value) == '1'
  end

  def self.set_remove(key, value)
    client.srem(key, value) == '1'
  end
end
