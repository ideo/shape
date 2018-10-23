class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :can_reopen?, :test_status,
             to: :test_collection

    after_commit :close_test, if: :archived_on_previous_save?

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards

    def duplicate!(**args)
      duplicate = super(args)
      return duplicate unless duplicate.persisted?
      duplicate = duplicate.becomes(Collection::TestCollection)
      duplicate.update(
        test_collection_id: nil,
        type: 'Collection::TestCollection',
      )
      # Had to reload otherwise AASM gets into weird state
      duplicate.reload
    end

    def question_item_created(question_item)
      return unless question_item.question_open?
      # Create open response collection for this new question item
      test_collection.create_open_response_collection_cards(
        open_question_items: [question_item],
      )
    end

    def complete_collection_cards
      # This is just excluding any blank question cards, but will still include
      # blank description or media question cards
      table = Item.arel_table
      collection_cards.joins(
        :item,
      ).where.not(table[:type].eq('Item::QuestionItem').and(table[:question_type].eq(nil)))
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end
  end
end
