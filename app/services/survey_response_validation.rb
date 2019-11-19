class SurveyResponseValidation < SimpleService
  delegate :test_collection,
           :question_answers,
           to: :@survey_response

  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    (answerable_ids - answered_ids).empty?
  end

  def answered_ids
    question_answers.pluck(:question_id, :idea_id)
  end

  def answerable_ids
    TestCollectionCardsForSurvey.call(test_collection).map do |card|
      [card.item.id, card.idea_id] if card.item.answerable?
    end.compact
  end
end
