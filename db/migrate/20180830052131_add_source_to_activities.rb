class AddSourceToActivities < ActiveRecord::Migration[5.1]
  def change
    add_reference :activities, :source, polymorphic: true
  end
end
