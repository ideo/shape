class CollectionCard
  class Link < CollectionCard
    archivable
    after_archive :after_archive_card
    after_unarchive :after_unarchive_card

    belongs_to :collection,
               optional: true,
               inverse_of: :cards_linked_to_this_collection
    belongs_to :item,
               optional: true,
               inverse_of: :cards_linked_to_this_item

    def can_edit?(user_or_group)
      # you can edit (meaning remove) a link card as long as you can content edit the parent collection
      parent.can_edit_content?(user_or_group)
    end
  end
end
