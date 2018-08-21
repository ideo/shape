class IndexBreadcrumbs < ActiveRecord::Migration[5.1]
  def change
    add_index :collections, :breadcrumb, using: :gin
    add_index :items, :breadcrumb, using: :gin
  end
end
