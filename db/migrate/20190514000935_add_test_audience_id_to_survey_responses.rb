class AddTestAudienceIdToSurveyResponses < ActiveRecord::Migration[5.1]
  def change
    add_belongs_to :survey_responses, :test_audience
  end
end
