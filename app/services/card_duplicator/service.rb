module CardDuplicator
  class Service
    include Interactor::Organizer
    include Interactor::Schema

    schema :to_collection,
           :placement,
           :cards,
           :for_user, # can be nil
           :user_initiated, # defaults to true
           :synchronous,
           # context added by interactors
           :building_template_instance,
           :duplicated_cards,
           :duplicated_collections,
           :duplicated_items

    organize(
      CardDuplicator::CreateCards,
      CardDuplicator::DuplicateExternalRecords,
      CardDuplicator::DuplicateLegendItems,
      CardDuplicator::QueueSubcollections,
      CardDuplicator::ProcessCollection,
      # .....
      # CreateDuplicateNotification,
    )
  end
end
