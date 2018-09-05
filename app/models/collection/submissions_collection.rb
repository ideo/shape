class Collection
  class SubmissionsCollection < Collection
    belongs_to :submission_box

    delegate :can_view?, to: :submission_box

    # override Resourceable methods
    def can_edit?(_user_or_group)
      false
    end

    private

    # override to mimic the submission_box breadcrumb
    def calculate_breadcrumb
      self.breadcrumb = submission_box.breadcrumb
    end
  end
end
