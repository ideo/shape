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

    delegate :ideas_collection, :test_show_media?, :collection_to_test_id,
             to: :test_results_collection

    before do
      @legend_item = test_results_collection.legend_item
      @order = -1
    end

    def call
      if test_show_media?
        create_idea_media_link
      else
        remove_idea_media_link
      end

      collection_cards.each do |card|
        if card.item.present?
          create_content_for_item_card(card)
        elsif card.ideas_collection_card?
          create_content_for_ideas_collection_card(card)
        end
      end
    end

    private

    def create_content_for_item_card(card)
      item = card.item
      if item.graphable_question?
        create_response_graph(card)
      elsif item.question_open?
        create_open_response_collection(card)
      elsif item.question_media? || !item.is_a?(Item::QuestionItem)
        create_media_item_link(card)
      end
    end

    def create_content_for_ideas_collection_card(card)
      return if in_collection_test?

      if idea.present?
        # Show media + title + description
        create_idea_collection_cards(card)
      else
        # Create collection with ideas
        create_ideas_collection(card)
      end
    end

    def remove_idea_media_link
      test_results_collection
        .link_collection_cards
        .identifier('first-idea-media')
        .first
        &.archive!
    end

    def create_idea_media_link
      idea_item = idea.presence
      idea_item ||= ideas_collection.items.question_idea.first if ideas_collection.present?

      return if idea_item.blank?

      TestResultsCollection::CreateItemLink.call!(
        default_attrs.merge(
          item: idea_item,
          width: 1,
          height: 2,
          identifier: 'first-idea-media',
          order: @order += 1,
        ),
      )
    end

    def create_media_item_link(card)
      TestResultsCollection::CreateItemLink.call!(
        default_attrs.merge(
          item: card.item,
          order: @order += 1,
          width: 2,
          height: 2,
        ),
      )
    end

    def create_ideas_collection(_card)
      TestResultsCollection::CreateIdeasCollection.call!(
        default_attrs
          .except(:parent_collection)
          .merge(
            test_results_collection: test_results_collection,
            order: @order += 1,
          ),
      )
    end

    def create_idea_collection_cards(_card)
      result = TestResultsCollection::CreateIdeaCollectionCards.call!(
        default_attrs
          .merge(
            idea_item: idea,
            num_idea: 1,
            order: @order += 1,
          ),
      )
      @order = result.order
    end

    def create_open_response_collection(card)
      TestResultsCollection::CreateOpenResponseCollection.call!(
        default_attrs.merge(
          item: card.item,
          order: @order += 1,
        ),
      )
    end

    def create_response_graph(card)
      result = TestResultsCollection::CreateResponseGraph.call!(
        default_attrs.merge(
          item: card.item,
          order: @order += 1,
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

    def in_collection_test?
      collection_to_test_id.present?
    end
  end
end
