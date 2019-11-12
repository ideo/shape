class GenerateTestSearchKey < BaseService
  delegate :test_collection, to: :@survey_response
  delegate :question_items, to: :test_collection

  def initialize(survey_response:)
    @survey_response = survey_response
  end

  # generate these kinds of keys:
  # test_idea_answer_?audience_1?
  # organization_answer_2_?audience_1?

  # def call
  #   test_collection
  #     .non_repeating_question_items
  #     .select(&:question_graphable?)
  #     .map do |question_item|
  #     question_item.
  #     ...
  #   end
  #
  #   end
  #
  #   test_collection.ideas_question_items.each do |question_item|
  #
  #   end
  #
  #     test_collection_id:,
  #     audience_id:,
  #     question_type: question_type,
  #     answer_value: answer_value,
  #     organization_id:
  # )
  # end
end
