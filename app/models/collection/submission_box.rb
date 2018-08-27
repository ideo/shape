class Collection
  class SubmissionBox < Collection
    belongs_to :submission_template, class_name: 'Collection', optional: true
    has_one :submissions_collection,
            class_name: 'Collection::SubmissionsCollection',
            dependent: :destroy

    validate :submission_template_is_a_master_template

    enum submission_box_type: {
      template: 0,
      text: 1,
      link: 2,
      file: 3,
    }

    def setup_submissions_collection
      build_submissions_collection(
        name: "#{name} Submissions",
        organization: organization,
      )
    end

    def setup_submissions_collection!
      setup_submissions_collection
      submissions_collection.save
    end

    def destroyable?
      # destroyable if it hasn't finished setting up
      submission_box_type.nil?
    end

    # this override is so that Roles::AddToChildren will also add the same roles
    # to all the submissions (which are technically children of the submissions_collection)
    def children
      (items + collections + submissions_collection.children)
    end

    private

    def submission_template_is_a_master_template
      return if submission_template.nil? || submission_template.master_template?
      errors.add(:submission_template, 'must be a Master Template')
    end
  end
end
