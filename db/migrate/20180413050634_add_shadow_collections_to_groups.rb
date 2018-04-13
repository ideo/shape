class AddShadowCollectionsToGroups < ActiveRecord::Migration[5.1]
  def change
    Group.all.each do |group|
      shared = Collection::SharedWithMeCollection.create_for_group(
        group, group.organization) unless group.is_primary?
      group.update(current_shared_collection: shared)
    end
  end
end
