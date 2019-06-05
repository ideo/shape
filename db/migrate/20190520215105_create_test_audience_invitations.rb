class CreateTestAudienceInvitations < ActiveRecord::Migration[5.1]
  def change
    create_table :test_audience_invitations do |t|
      t.belongs_to :test_audience, foreign_key: true
      t.belongs_to :user, foreign_key: true
      t.string :invitation_token, unique: true
      t.datetime :completed_at, null: true

      t.timestamps
    end
  end
end
