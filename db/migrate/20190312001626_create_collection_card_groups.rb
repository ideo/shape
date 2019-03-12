class CreateCollectionCardGroups < ActiveRecord::Migration[5.1]
  def change
    create_table :collection_card_groups do |t|

      t.timestamps
    end
  end
end
