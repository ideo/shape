class AddPicUrlSquareToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :pic_url_square, :string
  end
end
