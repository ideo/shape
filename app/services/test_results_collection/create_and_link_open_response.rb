module TestResultsCollection
  class CreateAndLinkOpenResponse
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_collection,
           :question_answer,
           :open_response_item

    delegate :question_answer,
             :open_response_item,
             :test_collection,
             to: :context

    delegate :question,
             :answer_text,
             :survey_response,
             :quote_card_ops,
             to: :question_answer

    def call
      create_open_response_item
      link_open_response_item
      open_response_item
    end

    private

    def create_open_response_item
      return if answer_text.blank?

      if question_answer.open_response_item.present?
        context.open_response_item = question_answer.open_response_item
        return
      end

      # Create the open response item on the Test Responses collection
      card = create_card(
        params: {
          width: 2,
          item_attributes: {
            type: 'Item::TextItem',
            content: answer_text,
            data_content: quote_card_ops,
          },
        },
        parent_collection: alias_open_responses_collection,
        created_by: question.test_open_responses_collection&.created_by,
      )

      item = card.record
      context.open_response_item = item
      question_answer.update(open_response_item: item)
    end

    def link_open_response_item
      return if answer_text.blank?

      find_or_create_card(
        params: {
          item_id: open_response_item.id,
          width: 2,
        },
        parent_collection: question_open_responses_collection,
        type: 'link',
      )

      idea_items.each do |idea_item|
        find_or_create_card(
          params: {
            item_id: open_response_item.id,
            width: 2,
          },
          parent_collection: question_idea_open_responses_collection(idea_item),
          type: 'link',
        )
      end
    end

    def question_open_responses_collection
      open_responses_collection(test_collection.test_results_collection)
    end

    def question_idea_open_responses_collection(idea_item)
      idea_collection = idea_collection(idea_item)
      open_responses_collection(idea_collection)
    end

    def open_responses_collection(parent_collection)
      CollectionCard.find_record_by_identifier(
        parent_collection, question, 'OpenResponses'
      )
    end

    def alias_open_responses_collection
      CollectionCard.find_record_by_identifier(
        survey_response, 'OpenResponses'
      )
    end

    def idea_collection(idea_item)
      CollectionCard.find_record_by_identifier(
        test_collection.test_results_collection, idea_item
      )
    end

    def idea_items
      test_collection
        .idea_items
        .includes(:test_results_collection)
    end
  end
end
