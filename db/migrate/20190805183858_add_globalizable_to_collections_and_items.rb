class AddGlobalizableToCollectionsAndItems < ActiveRecord::Migration[5.2]
  def up
    Collection.create_translation_table!(
      name: :string,
    )
    Collection.add_globalize_confirmable_column!
    Item.create_translation_table!(
      name: :string,
      content: :text,
      data_content: :jsonb,
    )
    Item.add_globalize_confirmable_column!
  end

  def down
    Collection.drop_translation_table!
    Item.drop_translation_table!
  end
end
