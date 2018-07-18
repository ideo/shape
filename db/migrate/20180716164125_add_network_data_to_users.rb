class AddNetworkDataToUsers < ActiveRecord::Migration[5.1]
  def up
    add_column :users, :network_data, :jsonb, default: {}
    User.find_each do |user|
      user.picture = user.pic_url_square
      user.save(touch: false)
    end
    remove_column :users, :pic_url_square
  end

  def down
    add_column :users, :pic_url_square, :string
    User.find_each do |user|
      user.pic_url_square = user.picture
      user.save(touch: false)
    end
    remove_column :users, :network_data
  end
end
