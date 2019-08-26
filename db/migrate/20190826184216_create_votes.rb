class CreateVotes < ActiveRecord::Migration[5.2]
  def change
    create_table :votes do |t|
      t.references :votable, polymorphic: true, index: false
      t.references :user, index: false
      t.timestamps
    end

    add_index :votes, [:votable_type, :votable_id, :user_id], unique: true
    add_column :collections, :voting_enabled, :boolean, default: false
  end
end
