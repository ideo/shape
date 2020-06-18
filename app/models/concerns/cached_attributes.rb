module CachedAttributes
  extend ActiveSupport::Concern

  def cache_attribute!(field, value, touch: true)
    # update locally
    send("#{field}=", value)
    # slightly convoluted way of writing a jsonb_set update on self (#update won't work here).
    # updates just the one sub-field without overwriting all of cached_attributes
    self.class.where(id: id).limit(1).update_all(%(
      cached_attributes = jsonb_set(
        cached_attributes, '{#{field}}', '#{value.to_json}'::jsonb
      )
    ))
    return unless touch

    update_columns(updated_at: Time.current)
  end
end
