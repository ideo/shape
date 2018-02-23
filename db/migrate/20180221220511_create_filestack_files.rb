class CreateFilestackFiles < ActiveRecord::Migration[5.1]
  def change
    create_table :filestack_files do |t|
      t.string :url, :handle, :filename, :mimetype
      t.integer :size
      t.timestamps
    end

    add_column :items, :filestack_file_id, :integer
  end
end
