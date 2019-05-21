class CreateTestAudienceInvitations < ActiveRecord::Migration[5.1]
  def change
    create_table :test_audience_invitations do |t|
      t.belongs_to :test_audience, foreign_key: true
      t.belongs_to :user, foreign_key: true

      t.timestamps
    end
  end
end
