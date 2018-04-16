# Wrapper for redis store

class Cache
  class_attribute :redis_client

  def self.client
    self.redis_client ||= Redis.new(url: ENV['REDIS_URL'])
  end

  def self.set(key, value, expires_in: nil, raw: false)
    value = JSON.generate(value) unless raw
    result = client.set(key, value) == 'OK'
    client.expire(key, expires_in.to_i) if result && expires_in.present?
    result
  end

  # Gets a value for this key
  # You can pass a block with the value you'd like to set if key is blank
  def self.get(key, expires_in: nil, raw: false, &block)
    value = client.get(key)
    return value if value.present? && raw
    value = JSON.parse(value) if value.present?
    if value.blank? && block.present?
      value = yield
      set(key, value, expires_in, raw)
    end
    value
  end

  def self.delete(key)
    client.del(key) == '1'
  end

  def self.increment(key)
    client.incr(key)
  end

  def self.decrement(key)
    client.decr(key)
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
