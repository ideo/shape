class AddSubjectsToComments < ActiveRecord::Migration[5.2]
  def change
    add_column :comments, :subject_id, :integer
    add_column :comments, :subject_type, :string

    add_index :comments, [:subject_id, :subject_type]
  end
end
