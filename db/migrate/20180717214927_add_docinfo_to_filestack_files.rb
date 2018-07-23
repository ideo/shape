class AddDocinfoToFilestackFiles < ActiveRecord::Migration[5.1]
  def change
    add_column :filestack_files, :docinfo, :jsonb
  end
end
