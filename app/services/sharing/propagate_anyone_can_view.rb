module Sharing
  class PropagateAnyoneCanView < SimpleService
    def initialize(collection:)
      @collection = collection
    end

    def call
      trickle_down_permissions
    end

    private

    def trickle_down_permissions
      # update all child collections to match @collection.anyone_can_view setting (either T/F)
      Collection.in_collection(@collection)
                .where("cached_attributes->'cached_inheritance'->>'private' != 'true'")
                .update_all(
                  anyone_can_view: @collection.anyone_can_view,
                  updated_at: Time.current,
                )
    end
  end
end
