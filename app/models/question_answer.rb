class QuestionAnswer < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question, class_name: 'Item::QuestionItem'
  belongs_to :open_response_item,
             class_name: 'Item::TextItem',
             inverse_of: :question_answer,
             optional: true

  delegate :completed?, to: :survey_response, prefix: true

  after_commit :update_survey_response, on: %i[create destroy]
  after_save :update_open_response_item, if: :survey_response_completed?

  private

  def update_open_response_item
    item = open_response_item || create_open_response_item
    item.update_attributes(
      ops: [],
    )
  end

  def create_open_response_item
    # Create the open response item on the Test Responses collection
    card_params = {
      item_attributes: {
        type: 'Item::TextItem',
        ops: [],
      },
    }
    builder = CollectionCardBuilder.new(
      params: card_params,
      parent_collection: question.test_open_responses_collection,
      user: initiated_by,
    )
    builder.create
    builder.collection_card.record
  end

  def update_survey_response
    survey_response.question_answer_created_or_destroyed
  end
end
