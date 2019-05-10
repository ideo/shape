class AddQuestionItemToCollectionCard < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :question_item_id, :integer
  end
end
