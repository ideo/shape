module CardDuplicator
  class QueueSubcollections
    include Interactor
    require_in_context :duplicated_cards
    delegate_to_context :for_user, :duplicated_cards, :synchronous

    def call
      queue_subcollections
    end

    private

    def queue_subcollections
      params = [
        duplicated_cards.map(&:id),
        for_user&.id,
      ]
      if synchronous
        SubcollectionDuplicationWorker.new.perform(*params)
      else
        SubcollectionDuplicationWorker.perform_async(*params)
      end
    end
  end
end
