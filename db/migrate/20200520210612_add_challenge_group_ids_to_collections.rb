class AddChallengeGroupIdsToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :challenge_admin_group_id, :integer
    add_column :collections, :challenge_reviewer_group_id, :integer
    add_column :collections, :challenge_participant_group_id, :integer
  end
end
