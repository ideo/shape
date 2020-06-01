class AddStartEndDateToCollection < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :start_date, :datetime
    add_column :collections, :end_date, :datetime
  end
end
