class AddPhoneNumberAndNullEmailToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :phone, :string
    change_column :users, :email, :string, null: true
  end
end
