module TestResultsCollection
  class CreateContent
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :created_by,
           :question_card

    require_in_context :test_results_collection

    delegate :test_results_collection,
             :created_by,
             :question_card,
             to: :context

    delegate :ideas_collection,
             :test_show_media?,
             :collection_to_test_id,
             :test_collection,
             :idea,
             :survey_response,
             to: :test_results_collection

    before do
      @legend_item = test_results_collection.legend_item
      @order = max_order
    end

    def call
      # place this first before other cards figure out where to go
      move_legend_item_to_third_spot if @legend_item.present?

      if question_card.present?
        create_content_for_item_card(question_card)
        # also call for each idea
        if master_results_collection?
          idea_items.each do |idea|
            TestResultsCollection::CreateContent.call(
              test_results_collection: idea.test_results_collection,
              question_card: question_card,
            )
          end
        end
        return
      end

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

      if survey_response.present?
        create_alias_open_response_collection
      else
        create_responses_collection
      end

      finish_creating_content
    end

    private

    def finish_creating_content
      # Create results collections for each idea
      if master_results_collection?
        idea_items.each do |idea_item|
          TestResultsCollection::CreateCollection.call(
            test_collection: test_collection,
            idea: idea_item,
            created_by: created_by,
          )
        end
      end

      test_collection.cache_cover!
      test_results_collection.reorder_cards!
      move_test_design_to_end

      test_results_collection.update(loading_content: false)
    end

    def create_content_for_item_card(card)
      item = card.item
      if item.graphable_question?
        create_response_graph(card)
      elsif item.question_open? && survey_response.blank?
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
        ),
      )
    end

    def create_media_item_link(card)
      TestResultsCollection::CreateItemLink.call!(
        default_attrs.merge(
          item: card.item,
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
          ),
      )
    end

    def create_idea_collection_cards(_card)
      result = TestResultsCollection::CreateIdeaCollectionCards.call!(
        default_attrs
          .merge(
            idea_item: idea,
            num_idea: 1,
          ),
      )
      @order = result.order
    end

    def create_alias_open_response_collection
      create_card(
        params: {
          identifier: CardIdentifier.call(survey_response, 'OpenResponses'),
          collection_attributes: {
            name: "#{survey_response.respondent_alias} Responses",
          },
        },
        parent_collection: parent_collection,
        created_by: created_by,
      )
    end

    def create_responses_collection
      TestResultsCollection::CreateResponsesCollection.call(
        parent_collection: parent_collection,
        test_collection: test_collection,
        created_by: created_by,
        idea: idea,
      )
    end

    def create_open_response_collection(card)
      TestResultsCollection::CreateOpenResponseCollection.call!(
        default_attrs.merge(
          question_item: card.item,
        ),
      )
    end

    def create_response_graph(card)
      result = TestResultsCollection::CreateResponseGraph.call!(
        default_attrs.merge(
          item: card.item,
          legend_item: @legend_item,
          survey_response: survey_response,
          idea: idea,
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
      test_collection
        .primary_collection_cards
        .visible
        .includes(:item, :collection)
    end

    def parent_collection
      if survey_response.present?
        survey_response.test_results_collection
      elsif idea.present?
        idea.test_results_collection
      else
        test_results_collection
      end
    end

    def in_collection_test?
      collection_to_test_id.present?
    end

    def master_results_collection?
      idea.blank? && survey_response.blank?
    end

    def move_legend_item_to_third_spot
      legend_card = @legend_item.parent_collection_card
      legend_card.update(
        row: 0,
        col: 3,
      )
    end

    def idea_items
      test_collection
        .idea_items
        .includes(:test_results_collection)
    end

    def max_order
      return -1 if test_results_collection.collection_cards.empty?

      test_results_collection.collection_cards.maximum(:order)
    end

    def move_test_design_to_end
      return unless master_results_collection?

      update_test_collection_name
      move_test_collection_inside_test_results
      move_roles_to_results_collection if move_roles?
    end

    def move_roles_to_results_collection
      test_collection.roles.each do |role|
        role.update(resource: test_results_collection)
      end
      # reload to re-associate the roles
      reload_collections
      # reanchor the test collection and children to test_results_collection
      test_collection.reanchor!(parent: test_results_collection, propagate: true)
    end

    def update_test_collection_name
      test_collection.update(
        name: "#{test_collection.name}#{Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX}",
      )
    end

    def move_test_collection_inside_test_results
      test_collection.parent_collection_card.update(
        collection_id: test_results_collection.id,
      )

      # pick up parent_collection_card relationship
      reload_collections

      create_card(
        params: {
          collection_id: test_collection.id,
          width: 1,
          height: 1,
        },
        parent_collection: test_results_collection,
        created_by: created_by,
      )
    end

    def reload_collections
      test_collection.reload
      test_results_collection.reload
    end

    def test_results_roles_anchor
      # anchor the test results to whatever the test collection was anchored to (could be nil for itself)
      test_collection.roles_anchor_collection
    end

    def move_roles?
      test_results_roles_anchor.blank?
    end
  end
end
