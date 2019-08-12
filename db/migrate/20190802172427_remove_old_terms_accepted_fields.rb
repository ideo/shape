class RemoveOldTermsAcceptedFields < ActiveRecord::Migration[5.2]
  def old_terms_fields
    %i[
      old_terms_accepted
      old_feedback_terms_accepted
      old_respondent_terms_accepted
    ]
  end

  def up
    old_terms_fields.each do |column|
      remove_column :users, column
    end
  end

  def down
    old_terms_fields.each do |column|
      add_column :users, column, :boolean, default: false
    end
  end
end
