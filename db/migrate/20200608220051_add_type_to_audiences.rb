class AddTypeToAudiences < ActiveRecord::Migration[5.2]
  def up
    add_column :audiences, :audience_type, :integer, null: true

    # if you already seeded audiences
    if Object.const_defined?('Audience')
      Audience.where(name: %i[Admins Reviewers Participants]).update_all(audience_type: 0)
    end
  end

  def down
    remove_column :audiences, :audience_type
  end
end
