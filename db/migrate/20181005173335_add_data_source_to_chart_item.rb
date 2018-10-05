class AddDataSourceToChartItem < ActiveRecord::Migration[5.1]
  def change
    add_reference :items, :data_source, polymorphic: true
  end
end
