class Collection
  class TestCollection < Collection
    has_many :survey_responses

    before_create :setup_test_cards
    after_create :add_test_tag

    # TODO: needs some status field to determine "launch state"?

    # override parent method to always include all cards (roles don't matter)
    def collection_cards_viewable_by(*)
      collection_cards.includes(:item, :collection)
    end

    def setup_test_cards
      primary_collection_cards.build(
        order: 0,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :context,
        },
      )
      primary_collection_cards.build(
        order: 1,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :blank_media,
        },
      )
    end

    def add_test_tag
      # create the special #test tag
      tag(
        self,
        with: 'test',
        on: :tags,
      )
      update_cached_tag_lists
      # no good way around saving a 2nd time after_create
      save
    end
  end
end
