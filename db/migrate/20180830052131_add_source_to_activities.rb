class AddSourceToActivities < ActiveRecord::Migration[5.1]
  def change
    add_reference :activities, :source, polymorphic: true
    add_reference :activities, :destination, polymorphic: true
  end
end
