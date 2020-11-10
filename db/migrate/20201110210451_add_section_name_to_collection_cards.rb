class AddSectionNameToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :section_name, :string
  end
end
