class ToggleAnyoneCanView < SimpleService
  def initialize(collection)
    @collection = collection
  end

  def call
    trickle_down_permissions
  end

  private

  def trickle_down_permissions
    Collection.in_collection(@collection)
              .where("cached_attributes->'cached_inheritance'->>'private' != 'true'")
              .update_all(anyone_can_view: @collection.anyone_can_view)
  end
end
