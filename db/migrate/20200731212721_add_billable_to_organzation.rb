class AddBillableToOrganzation < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :billable, :boolean, default: false
  end
end
