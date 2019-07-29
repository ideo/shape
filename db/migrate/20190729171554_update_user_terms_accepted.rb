class UpdateUserTermsAccepted < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :terms_accepted_data, :jsonb, default: {}
  end
end
