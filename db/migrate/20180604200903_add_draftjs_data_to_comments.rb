class AddDraftjsDataToComments < ActiveRecord::Migration[5.1]
  def change
    add_column :comments, :draftjs_data, :jsonb
  end
end
