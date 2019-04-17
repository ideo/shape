class QuestionAnswer < ApplicationRecord
  # NOTE: survey_response then touches its test_collection,
  # so that answering one question can bust the collection caching for viewing charts
  belongs_to :survey_response, touch: true
  belongs_to :question, class_name: 'Item::QuestionItem'
  belongs_to :open_response_item,
             class_name: 'Item::TextItem',
             inverse_of: :question_answer,
             optional: true

  delegate :completed?, to: :survey_response, prefix: true

  validates :answer_number, presence: true, if: :answer_number_required?

  after_commit :update_survey_response, on: %i[create destroy], if: :survey_response_present?
  after_commit :update_collection_test_scores, if: :survey_response_present?
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
    return destroy_open_response_item_and_card if answer_text.blank?
    item.content = answer_text
    item.import_plaintext_content(answer_text)
    item.save
  end

  def create_open_response_item
    # Create the open response item on the Test Responses collection
    card_params = {
      item_attributes: {
        type: 'Item::TextItem',
        content: answer_text,
        data_content: QuillContentConverter.new(answer_text).text_to_quill_ops,
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
    return if survey_response.destroyed?
    survey_response.question_answer_created_or_destroyed
  end

  def update_collection_test_scores
    return if survey_response.destroyed?
    return unless survey_response.completed?
    survey_response.cache_test_scores!
  end

  def answer_number_required?
    question&.scale_question?
  end
end
