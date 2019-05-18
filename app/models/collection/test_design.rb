class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :can_reopen?,
             :launchable?,
             :live_or_was_launched?,
             :gives_incentive?,
             :test_status,
             :collection_to_test,
             to: :test_collection

    after_commit :close_test, if: :archived_on_previous_save?

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards

    has_many :survey_responses, through: :test_collection

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
      test_collection.create_open_response_collections(
        open_question_items: [question_item],
      )
    end

    def answerable_complete_question_items
      complete_question_items(answerable_only: true)
    end

    def complete_question_items(answerable_only: false)
      # This is for the purpose of finding all completed items to display in the survey
      # i.e. omitting any unfinished/blanks
      questions = answerable_only ? question_items.answerable : items
      questions.reject do |i|
        i.is_a?(Item::QuestionItem) && i.question_type.blank? ||
          i.question_type == 'question_open' && i.content.blank? ||
          i.question_type == 'question_category_satisfaction' && i.content.blank? ||
          i.question_type == 'question_media'
      end
    end

    def complete_question_cards
      complete_question_items.collect(&:parent_collection_card)
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end
  end
end
