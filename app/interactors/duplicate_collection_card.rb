class DuplicateCollectionCard
  include Interactor::Organizer

  # stubbed out interactors
  organize(
    DuplicateCards,
    DuplicateLegendItems,
    # ReorderCards,
    # CacheCover,
    CreateDuplicateNotification,
  )
end
