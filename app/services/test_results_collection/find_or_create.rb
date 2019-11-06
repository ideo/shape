module TestResultsCollection
  class FindOrCreate
    include Interactor::Organizer
    include Interactor::Schema

    schema :test_collection,
           :test_results_collection,
           :idea,
           :created_by

    require_in_context :test_collection

    delegate :test_collection, :created_by, :test_results_collection,
             to: :context

    delegate :legend_item, to: :test_results_collection

    organize CreateCollection,
             CreateOpenResponseCollections,
             CreateResponseGraphs,
             CreateMediaItemLinks

    before do
      context.created_by ||= test_collection.created_by
    end

    def call
      ActiveRecord::Base.transaction do
        super
      rescue Interactor::Failure => e
        raise ActiveRecord::Rollback, e.message
      end
    end

    after do
      context.test_results_collection ||= test_collection.test_results_collection
      # might not need this next step?
      test_collection.cache_cover!
      test_results_collection.reorder_cards!
      move_legend_item_to_third_spot if legend_item.present?
    end

    private

    def move_legend_item_to_third_spot
      legend_card = legend_item.parent_collection_card
      return if legend_card.order == 2

      legend_card.move_to_order(2)
    end
  end
end
