class AddFeedbackTermsAcceptedToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :feedback_terms_accepted, :boolean, default: false
  end
end
