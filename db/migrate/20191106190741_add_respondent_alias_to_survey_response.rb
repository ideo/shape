class AddRespondentAliasToSurveyResponse < ActiveRecord::Migration[5.2]
  def change
    add_column :survey_responses, :respondent_alias, :string
  end
end
