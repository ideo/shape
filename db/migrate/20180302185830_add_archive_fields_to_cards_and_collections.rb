class AddArchiveFieldsToCardsAndCollections < ActiveRecord::Migration[5.1]
  def up
    Collection.add_archived_column!
    CollectionCard.add_archived_column!
  end

  def down
    Collection.try(:remove_archived_column!)
    CollectionCard.try(:remove_archived_column!)
  end
end
