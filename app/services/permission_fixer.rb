class PermissionFixer < SimpleService
  def initialize(collection, inherit_from: nil)
    @collection = collection
    # the first run through we tell it to inherit from this collection on down
    @inherit_from = inherit_from || collection
  end

  def call
    fix_permissions
  end

  private

  def fix_permissions
    @collection.collection_cards.each do |card|
      if card.link?
        next
      end
      record = card.record
      reassign_roles(record)
      next unless record.is_a? Collection
      # continue recursively
      PermissionFixer.call(record, inherit_from: @inherit_from)
    end
  end

  def reassign_roles(record)
    record.roles.destroy_all
    @inherit_from.roles.each do |role|
      role.duplicate!(assign_resource: record)
    end
  end
end
