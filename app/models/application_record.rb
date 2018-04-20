class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  def jsonapi_cache_key
    [
      self.class.base_class.name,
      id,
      (updated_at || created_at).to_i,
    ].compact.join('_')
  end

  # default to false, can be overridden by classes
  def searchable?
    false
  end
end
