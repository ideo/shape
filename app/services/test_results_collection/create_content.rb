module TestResultsCollection
  class CreateContent
    include Interactor
    include Interactor::Schema

    schema :test_results_collection,
           :created_by,
           :idea,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection, :created_by, :idea,
             to: :context

    delegate :ideas_collection, to: :test_results_collection

    before do
      @legend_item = test_results_collection.legend_item
    end

    def call
      create_idea_media_link

      collection_cards.each do |card|
        item = card.item
        if item.present?
          if item.scale_question?
            create_response_graph(card)
          elsif item.question_open?
            create_open_response_collection(card)
          elsif item.question_media? || !item.is_a?(Item::QuestionItem)
            create_media_item_link(card)
          end
        elsif card.ideas_collection_card? && idea.present?
          # This assumes any collection is the ideas collection
          create_idea_collection(card)
        end
      end
    end

    private

    def create_idea_media_link
      idea_item = idea.presence || ideas_collection.items.question_idea.first

      TestResultsCollection::CreateItemLink.call!(
        default_attrs.merge(
          item: idea_item,
          order: -1,
        ),
      )
    end

    def create_media_item_link(card)
      TestResultsCollection::CreateItemLink.call!(
        default_attrs.merge(
          item: card.item,
          order: card.order,
        ),
      )
    end

    def create_idea_collection(card)
      TestResultsCollection::CreateIdeaCollection.call!(
        default_attrs
          .merge(
            idea_item: idea,
            order: card.order,
          ),
      )
    end

    def create_open_response_collection(card)
      TestResultsCollection::CreateOpenResponseCollection.call!(
        default_attrs.merge(
          item: card.item,
          order: card.order,
        ),
      )
    end

    def create_response_graph(card)
      result = TestResultsCollection::CreateResponseGraph.call!(
        default_attrs.merge(
          item: card.item,
          order: card.order,
          legend_item: @legend_item,
        ),
      )
      @legend_item ||= result.legend_item
      result
    end

    def default_attrs
      {
        parent_collection: parent_collection,
        created_by: created_by,
      }
    end

    def collection_cards
      test_results_collection
        .test_collection
        .primary_collection_cards
        .includes(:item, :collection)
    end

    def parent_collection
      idea.present? ? idea.test_results_collection : test_results_collection
    end
  end
end
