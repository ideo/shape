class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  def jsonapi_cache_key
    [
      self.class.base_class.name,
      id,
      (updated_at || created_at).to_f,
    ].compact.join('_')
  end

  # default to false, can be overridden by classes
  def searchable?
    false
  end

  def skip_network_actions?
    Rails.env.development? || ENV['CYPRESS'].present? || ENV['SKIP_NETWORK_ACTIONS'].present?
  end
end
