class AddTypetoAudiences < ActiveRecord::Migration[5.2]
  def up
    add_column :audiences, :audience_type, :integer, null: true

    # if you already seeded audiences
    Audience.find_by(name: 'Admins')&.update(audience_type: 1)
    Audience.find_by(name: 'Reviewers')&.update(audience_type: 1)
    Audience.find_by(name: 'Participants')&.update(audience_type: 1)
  end

  def down
    remove_column :audiences, :audience_type
  end
end
