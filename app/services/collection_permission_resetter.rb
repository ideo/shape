# Currently only used in an admin (e.g. rails console) context
class CollectionPermissionResetter < SimpleService
  def initialize(collection:, parent_collection: nil)
    @collection = collection
    @parent_collection = parent_collection || collection
    @parent_roles = @parent_collection.roles
  end

  def call
    reset_child_permissions
  end

  private

  def reset_child_permissions
    @collection.collection_cards.each do |card|
      next if card.link?
      record = card.record
      record.roles.destroy_all
      @parent_roles.each do |role|
        role.duplicate!(assign_resource: record)
      end
      next unless record.is_a? Collection
      # recursively reset for subcollections
      CollectionPermissionResetter.call(
        collection: record, parent_collection: @parent_collection,
      )
    end
  end
end
