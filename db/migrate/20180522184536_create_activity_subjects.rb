class CreateActivitySubjects < ActiveRecord::Migration[5.1]
  def change
    create_table :activity_subjects do |t|
      t.references :activity
      t.references :subject, polymorphic: true

      t.timestamps
    end
  end
end
