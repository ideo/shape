class AddTemplateHelperToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :show_template_helper, :boolean, default: true
  end
end
