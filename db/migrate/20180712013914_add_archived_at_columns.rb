class AddArchivedAtColumns < ActiveRecord::Migration[5.1]
  def up
    [Group, Item, Collection, CollectionCard].each do |model|
      model.add_archived_at_column!
    end
  end

  def down
    [Group, Item, Collection, CollectionCard].each do |model|
      model.try(:remove_archived_at_column!)
    end
  end
end
