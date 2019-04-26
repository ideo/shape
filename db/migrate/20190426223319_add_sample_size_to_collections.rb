class AddSampleSizeToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :test_sample_size, :integer, default: 0
  end
end
