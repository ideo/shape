class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :can_reopen?, :test_status,
             to: :test_collection
    delegate :collection_to_test, to: :test_collection

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
        # Don't set this to be a master template if the parent is a template
        master_template: parent.master_template? ? false : master_template,
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

    def complete_question_cards
      # # This is just excluding any blank question cards
      # table = Item.arel_table
      # collection_cards.joins(
      #   :item,
      # ).where.not(
      #   table[:type].eq('Item::QuestionItem').and(table[:question_type].eq(nil))
      # )
      # NOTE: there is probably a way to directly query for this like above,
      # but this was the most straightforward
      valid_items = items.reject do |i|
        i.is_a?(Item::QuestionItem) && i.question_type.blank? ||
          i.question_type == 'question_open' && i.content.blank? ||
          i.question_type == 'question_category_satisfaction' && i.content.blank? ||
          i.question_type == 'question_media'
      end
      valid_items.collect(&:parent_collection_card)
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end
  end
end
