class UpdateUserTermsAccepted < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :terms_accepted_data, :jsonb, default: {}

    # temporary rename until we drop these columns
    rename_column :users, :terms_accepted, :old_terms_accepted
    rename_column :users, :feedback_terms_accepted, :old_feedback_terms_accepted
    rename_column :users, :respondent_terms_accepted, :old_respondent_terms_accepted
  end
end
