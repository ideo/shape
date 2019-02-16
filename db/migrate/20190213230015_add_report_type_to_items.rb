class AddReportTypeToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :report_type, :integer
  end
end
