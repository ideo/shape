module CollectionGrid
  class RowInserter < SimpleService
    attr_reader :errors

    def initialize(
      row: 0,
      collection:,
      action: :insert_row,
      movement: nil
    )
      @row = row
      @parent_collection = collection
      @action = action
      @errors = []
      @movement = movement || calculate_movement
    end

    def call
      move_all_cards_in_direction
    end

    private

    def calculate_movement
      @action.to_sym == :insert_row ? 1 : -1
    end

    def move_all_cards_in_direction
      cards = select_all_cards_below
      # capture these before things get moved
      card_ids = cards.pluck(:id)
      cards.update_all([
        "row = row + #{@movement}, updated_at = ?",
        Time.current,
      ])

      return unless @parent_collection.master_template?

      update_template_instances(card_ids)
    end

    def select_all_cards_below
      @parent_collection.collection_cards.where(
        CollectionCard.arel_table[:row].gt(@row),
      )
    end

    def update_template_instances(card_ids)
      UpdateTemplateInstancesWorker.perform_async(
        @parent_collection.id,
        card_ids,
        :update_card_attributes,
      )
    end
  end
end
