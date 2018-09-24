class CreateSurveyResponses < ActiveRecord::Migration[5.1]
  def change
    create_table :survey_responses do |t|
      t.references :test_collection, index: true

      t.timestamps
    end
  end
end
