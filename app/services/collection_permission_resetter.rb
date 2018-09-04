# Currently only used in an admin (e.g. rails console) context
class CollectionPermissionResetter < SimpleService
  def initialize(collection:, parent_collection: nil)
    @collection = collection
    # the first run through we tell it to inherit from this collection on down
    @parent_collection = parent_collection || collection
  end

  def call
    reset_child_permissions
  end

  private

  def reset_child_permissions
    @collection.collection_cards.each do |card|
      next if card.link?
      record = card.record
      reassign_roles(record)
      next unless record.is_a? Collection
      # recursively reset for subcollections
      CollectionPermissionResetter.call(
        collection: record, parent_collection: @parent_collection,
      )
    end
  end

  def reassign_roles(record)
    record.roles.destroy_all
    @parent_collection.roles.each do |role|
      role.duplicate!(assign_resource: record)
    end
  end
end
