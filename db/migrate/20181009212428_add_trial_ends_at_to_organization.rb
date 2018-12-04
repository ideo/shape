class AddTrialEndsAtToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :trial_ends_at, :datetime
  end
end
