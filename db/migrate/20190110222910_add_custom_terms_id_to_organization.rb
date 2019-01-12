class AddCustomTermsIdToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :terms_text_item_id, :bigint
  end
end
