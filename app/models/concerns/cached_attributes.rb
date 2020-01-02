module CachedAttributes
  extend ActiveSupport::Concern

  def cache_attributes!(fields)
    # not using the store_accessor directly here because of:
    # https://github.com/rails/rails/pull/32563
    self.cached_attributes ||= {}
    fields.each do |field, val|
      self.cached_attributes[field.to_s] = val
    end
    # update without callbacks
    return unless changes.present?

    update_columns cached_attributes: cached_attributes, updated_at: Time.current
  end
end
