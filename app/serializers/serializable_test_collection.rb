class SerializableTestCollection < SerializableSimpleCollection
  type 'collections'

  has_many :test_audiences

  attributes :test_status, :test_closed_at, :test_show_media, :parent_challenge

  has_many :question_cards do
    data do
      # this will repeat the idea cards per idea
      TestCollectionCardsForSurvey.call(@object)
    end
  end

  attribute :survey_response_for_user_id do
    @survey_response_for_user.try(:id)
  end

  attribute :is_submission_test do
    @object.submission_test?
  end

  attribute :gives_incentive do
    @object.gives_incentive_for?(@test_audience_id)
  end

  attribute :is_inside_a_submission do
    @inside_a_submission.nil? ?
      @object.inside_a_submission? :
      @inside_a_submission
  end

  attribute :is_inside_a_challenge do
    @object.inside_a_challenge?
  end
end
