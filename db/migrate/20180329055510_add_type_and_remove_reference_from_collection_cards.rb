class AddTypeAndRemoveReferenceFromCollectionCards < ActiveRecord::Migration[5.1]
  def up
    add_column :collection_cards, :type, :string
    remove_column :collection_cards, :reference

    CollectionCard.update_all(type: 'CollectionCard::Primary')
  end

  def down
    remove_column :collection_cards, :type
    add_column :collection_cards, :reference, :boolean, default: false
  end
end
