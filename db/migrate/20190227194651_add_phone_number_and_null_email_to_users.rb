class AddPhoneNumberAndNullEmailToUsers < ActiveRecord::Migration[5.1]
  def up
    add_column :users, :phone, :string
    change_column :users, :email, :string, null: true
  end
  def down
    remove_column :users, :phone
    change_column :users, :email, :string, null: false
  end
end
