class AddStatusToTestAudience < ActiveRecord::Migration[5.1]
  def change
    add_column :test_audiences, :status, :integer, default: 0
    add_column :test_audiences, :closed_at, :datetime
  end
end
