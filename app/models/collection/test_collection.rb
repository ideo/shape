class Collection
  class TestCollection < Collection
    has_many :survey_responses

    after_create :add_test_tag

    # TODO: needs some status field to determine "launch state"?

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
