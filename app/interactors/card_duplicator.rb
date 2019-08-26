class CardDuplicator
  include Interactor::Organizer
  include Interactor::Schema

  schema :to_collection,
         :placement,
         :cards,
         :for_user,
         # ...
         :user_initiated,
         :duplicated_cards,
         :from_collection

  # stubbed out interactors
  organize(
    DuplicateCollectionCards::CreateCards,
    DuplicateCollectionCards::CreateItems,
    DuplicateCollectionCards::CreateCollections,
    # .....
    # DuplicateLegendItems,
    # ReorderCards,
    # CacheCover,
    # CreateDuplicateNotification,
  )
end
