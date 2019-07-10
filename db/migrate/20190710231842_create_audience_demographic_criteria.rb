class CreateAudienceDemographicCriteria < ActiveRecord::Migration[5.2]
  def change
    create_table :audience_demographic_criteria do |t|
      t.references :audience
      t.string :criteria_key
      t.timestamps
    end
  end
end
