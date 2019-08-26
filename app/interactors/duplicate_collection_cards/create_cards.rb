module DuplicateCollectionCards
  class CreateCards
    include Interactor
    require_in_context :to_collection, :placement, :cards, :for_user
    delegate_to_context :to_collection, :placement, :cards, :for_user, :user_initiated

    def call
      create_cards
    end

    private

    def create_cards
      new_cards = []

      cards.each do |original|
        type = original.type
        # turn links into primary cards
        if type == 'CollectionCard::Link' && user_initiated
          type = 'CollectionCard::Primary'
        end
        new_cards << CollectionCard.new(
          original.slice(attrs_to_copy).merge(
            parent: to_collection,
            order: order,
            pinned: should_pin?,
            type: type,
            cloned_from_id: original.id,
          ),
        )
      end
      result = CollectionCard.import(new_cards, validate: false)
      # TODO: ...
      if result.failed_instances.present?
        # .....
      end
      # new_cards are now persisted
      context.duplicated_cards = new_cards
    end

    def order
      if placement == 'beginning'
        0
      elsif placement == 'end'
        to_collection.cache_card_count
      else
        # a number
        placement || 0
      end
    end

    def should_pin?
      # Make it pinned if you're duplicating it into a master template
      to_collection.master_template?
    end

    def attrs_to_copy
      %i[
        width
        height
        hidden
        image_contain
        is_cover
        show_replace
      ]
    end
  end
end
