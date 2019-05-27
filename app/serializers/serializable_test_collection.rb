class SerializableTestCollection < SerializableSimpleCollection
  type 'collections'

  has_many :test_audiences

  attributes :test_status, :test_closed_at

  has_many :question_cards do
    data do
      @object.try(:test_design).try(:complete_question_cards)
    end
  end

  attribute :survey_response_for_user_id do
    @survey_response_for_user.try(:id)
  end

  attribute :is_submission_test do
    @object.submission_test?
  end

  attribute :gives_incentive do
    @object.try(:gives_incentive?)
  end
end
