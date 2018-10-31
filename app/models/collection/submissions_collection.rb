class Collection
  class SubmissionsCollection < Collection
    belongs_to :submission_box

    delegate :can_view?, to: :submission_box

    # override Resourceable methods
    def can_edit?(_user_or_group)
      false
    end

    # override to create the correct breadcrumb trail
    def parent
      submission_box
    end

    # don't shown this in the breadcrumb since it's tucked into the submission_box
    def breadcrumbable?
      false
    end
  end
end
