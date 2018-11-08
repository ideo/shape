class Collection
  class SubmissionsCollection < Collection
    belongs_to :submission_box

    delegate :can_view?, to: :submission_box

    # override Resourceable methods
    def can_edit?(_user_or_group)
      false
    end

    def parent
      # not actually parent by db relation, but parent for breadcrumb purposes
      submission_box
    end

    def sort_options
      collections
        .unscope(:order)
        .select('jsonb_object_keys(cached_test_scores) as types')
        .group('types')
        .map(&:types)
    end
  end
end
