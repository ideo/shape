require 'rails_helper'

RSpec.describe SurveyResponseCompletionWorker, type: :worker do
  describe '#perform' do
    let!(:survey_response) { create(:survey_response) }
    it 'calls SurveyResponseCompletion service' do
      expect(SurveyResponseCompletion).to receive(:call).with(survey_response)
      SurveyResponseCompletionWorker.new.perform(survey_response.id)
    end
  end
end
