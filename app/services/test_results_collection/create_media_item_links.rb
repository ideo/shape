module TestResultsCollection
  class CreateMediaItemLinks
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :created_by,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection,
             to: :context

    delegate :test_collection, :ideas_collection,
             to: :test_results_collection

    def call
      # since we're placing things at the front one by one, we reverse the order
      media_question_items.reverse.map do |media_item|
        next if media_item.cards_linked_to_this_item.present?

        link_media_item(media_item)
      end
    end

    private

    def link_media_item(media_item)
      link = CollectionCard::Link.create(
        parent: test_results_collection,
        item_id: media_item.id,
        width: 1,
        height: 2,
        order: -1,
      )

      return link if link.persisted?

      context.fail!(
        message: link.errors.full_messages.to_sentence,
      )
    end

    def media_question_items
      return @media_question_items if @media_question_items.present?

      items = test_collection.items
      items += ideas_collection.items if ideas_collection.present?
      @media_question_items = items.reject { |item| item.type == 'Item::QuestionItem' }
    end
  end
end
