module RealtimeEditorsViewers
  extend ActiveSupport::Concern

  def single_edit(user = nil)
    Cache.delete(editing_cache_key)
    publish_to_channel(
      current_editor: user ? user.as_json : {},
    )
  end

  def received_changes(data, user = nil)
    publish_to_channel(
      current_editor: user ? user.as_json : {},
      data: data,
    )
  end

  # Track viewers by user_id
  # Using an increment counter was prone to dupe issues (e.g. same user with two browser windows open)
  def started_viewing(user = nil, dont_notify: false)
    Cache.set_add(viewing_cache_key, user.id) if user
    return if dont_notify

    received_changes(num_viewers_changed: true)
  end

  def stopped_viewing(user = nil, dont_notify: false)
    Cache.set_remove(viewing_cache_key, user.id) if user
    return if dont_notify

    received_changes(num_viewers_changed: true)
  end

  def stream_name
    editing_cache_key
  end

  def publish_error
    ActionCable.server.broadcast stream_name, {}, code: :unprocessable_entity
  end

  def num_viewers
    Cache.set_members(viewing_cache_key).size
  end

  private

  def currently_editing_user_as_json
    user_id = Cache.get(editing_cache_key, raw: true)
    return {} if user_id.blank?

    User.find(user_id).as_json
  end

  def publish_to_channel(merge_data = {})
    defaults = {
      current_editor: currently_editing_user_as_json,
      num_viewers: num_viewers,
      record_id: id.to_s,
      record_type: jsonapi_type_name,
    }
    data = defaults.merge!(merge_data)
    ActionCable.server.broadcast stream_name, data
  end

  def editing_cache_key
    "#{self.class.base_class.name}_#{id}_editing"
  end

  def viewing_cache_key
    "#{self.class.base_class.name}_#{id}_viewing"
  end
end
