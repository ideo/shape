module CachedAttributes
  extend ActiveSupport::Concern

  def cache_attributes!(fields, touch: true)
    # always reload cached_attributes from DB to be more threadsafe
    reload
    # not using the store_accessor directly here because of:
    # https://github.com/rails/rails/pull/32563
    self.cached_attributes ||= {}
    fields.each do |field, val|
      self.cached_attributes[field.to_s] = val
    end
    # update without callbacks
    return unless changes.present?

    attrs = { cached_attributes: cached_attributes }
    if touch
      attrs[:updated_at] = Time.current
    end
    update_columns attrs
  end
end
