class QuestionAnswer < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question, class_name: 'Item::QuestionItem'
  belongs_to :open_response_item,
             class_name: 'Item::TextItem',
             inverse_of: :question_answer,
             optional: true

  delegate :completed?, to: :survey_response, prefix: true

  after_commit :update_survey_response, on: %i[create destroy], if: :survey_response_present?
  before_save :update_open_response_item, if: :update_open_response_item?
  before_destroy :destroy_open_response_item_and_card, if: :open_response_item_present?

  private

  def survey_response_present?
    survey_response.present?
  end

  def open_response_item_present?
    open_response_item.present?
  end

  def update_open_response_item?
    survey_response_completed? &&
      question.question_open? &&
      question.test_open_responses_collection.present? &&
      (answer_text_changed? || open_response_item.blank?)
  end

  def update_open_response_item
    item = open_response_item
    return create_open_response_item if item.blank?
    item.set_ops_from_plain_text(answer_text)
    item.save
  end

  def create_open_response_item
    # Create the open response item on the Test Responses collection
    card_params = {
      item_attributes: {
        type: 'Item::TextItem',
        content: answer_text,
        text_data: {
          ops: TextToQuillOps.call(answer_text),
        },
      },
    }
    builder = CollectionCardBuilder.new(
      params: card_params,
      parent_collection: question.test_open_responses_collection,
      user: question.test_open_responses_collection.created_by,
    )
    if builder.create
      self.open_response_item = builder.collection_card.record
    else
      errors.add(:open_response_item, builder.errors.full_messages.join('. '))
      throw :abort
    end
  end

  def destroy_open_response_item_and_card
    open_response_item.parent_collection_card.destroy.destroyed? &&
      open_response_item.destroy.destroyed?
  end

  def update_survey_response
    survey_response.question_answer_created_or_destroyed
  end
end
