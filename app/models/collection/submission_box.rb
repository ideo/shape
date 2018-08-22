class Collection
  class SubmissionBox < Collection
    belongs_to :submission_template, class_name: 'Collection', optional: true
    validate :submission_template_is_a_master_template

    enum submission_box_type: {
      template: 0,
      text: 1,
      link: 2,
      file: 3,
    }

    private

    def submission_template_is_a_master_template
      return if submission_template.nil? || submission_template.master_template?
      errors.add(:submission_template, 'must be a Master Template')
    end
  end
end
