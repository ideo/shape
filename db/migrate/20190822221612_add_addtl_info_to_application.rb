class AddAddtlInfoToApplication < ActiveRecord::Migration[5.2]
  def change
    add_column :applications, :invite_url, :string
    add_column :applications, :invite_cta, :string
    add_column :applications, :email, :string
    add_column :applications, :logo_url, :string
  end
end
