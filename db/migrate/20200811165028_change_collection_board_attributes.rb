class ChangeCollectionBoardAttributes < ActiveRecord::Migration[5.2]
  def self.up
    change_column :collections, :num_columns, :integer, default: 4
    # we no longer need not-null constraint
    change_column :collection_cards, :order, :integer, null: true, default: nil
    # resolve some other issues when these are nil
    change_column :collection_cards, :height, :integer, default: 1
    change_column :collection_cards, :width, :integer, default: 1

    # also for new 4wfc helper
    change_column :users, :show_helper, :boolean, default: false
  end

  def self.down
    change_column :collections, :num_columns, :integer, default: nil
    change_column :collection_cards, :order, :integer, null: false
    change_column :collection_cards, :height, :integer, default: nil
    change_column :collection_cards, :width, :integer, default: nil
    change_column :users, :show_helper, :boolean, default: true
  end
end
