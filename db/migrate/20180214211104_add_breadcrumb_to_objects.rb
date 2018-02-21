class AddBreadcrumbToObjects < ActiveRecord::Migration[5.1]
  def up
    Item.add_breadcrumb_column!
    Collection.add_breadcrumb_column!
  end

  def down
    Item.try(:remove_breadcrumb_column!)
    Collection.try(:remove_breadcrumb_column!)
  end
end
