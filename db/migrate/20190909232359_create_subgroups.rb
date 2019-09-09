class CreateSubgroups < ActiveRecord::Migration[5.2]
  def change
    create_table :subgroups do |t|
      # Does this need to be a separate table or should it just be a Group?
    end
  end
end
