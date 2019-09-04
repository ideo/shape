module CardDuplicator
  class ProcessCollection
    include Interactor

    require_in_context :to_collection
    delegate_to_context :to_collection

    def call
      process_collection
    end

    private

    def process_collection
      to_collection.reorder_cards!
      to_collection.cache_card_count!
      to_collection.cache_cover!
    end
  end
end
