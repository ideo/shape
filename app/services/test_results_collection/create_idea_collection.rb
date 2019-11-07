module TestResultsCollection
  class CreateIdeaCollection
    include Interactor
    include Interactor::Schema

    schema :test_results_collection,
           :item,
           :order,
           :created_by,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection,
             to: :context

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        create_idea_collection
        # TODO: create all cards
      end
    end

    private

    def existing_card
      test_results_collection
        .primary_collection_cards
        .joins(:collection)
        .where(
          collection: { idea_id: idea.id },
        )
        .first
    end

    def create_idea_collection
      create_card(
        attrs: idea_collection_attrs,
        parent_collection: test_results_collection,
        created_by: created_by,
      )
    end

    def idea_collection_attrs
      {
        name: idea.name,
      }
    end
  end
end
