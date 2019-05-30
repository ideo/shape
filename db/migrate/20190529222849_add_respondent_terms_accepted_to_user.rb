class AddRespondentTermsAcceptedToUser < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :respondent_terms_accepted, :boolean, default: false
  end
end
