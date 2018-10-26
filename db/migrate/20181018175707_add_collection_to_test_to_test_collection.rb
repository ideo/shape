class AddCollectionToTestToTestCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :collection_to_test_id, :bigint, index: true
    add_reference :survey_responses, :user, index: true
  end
end
