class Collection
  class SubmissionBox < Collection
    belongs_to :submission_template, class_name: 'Collection', optional: true
    has_one :submissions_collection,
            class_name: 'Collection::SubmissionsCollection',
            dependent: :destroy
    validate :submission_template_is_a_master_template
    # also archive the submissions_collection along with collection defaults
    self.archive_with += %i[submissions_collection]

    enum submission_box_type: {
      template: 0,
      text: 1,
      link: 2,
      file: 3,
    }

    def duplicate!(**args)
      duplicate = super(args)
      return duplicate if duplicate.new_record? || duplicate.errors.present?
      duplicate.setup_submissions_collection!
      duplicate
    end

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

    def available_submission_tests(for_user:)
      return [] unless submission_box_type == 'template'
      test_ids = submissions_collection.collections.map do |submission|
        submission.submission_attrs['launchable_test_id']
      end
      user_responses = SurveyResponse.where(
        test_collection_id: test_ids,
        user_id: for_user.id,
        status: 'completed',
      )
      # omit any tests where the user has already completed their response
      test_ids -= user_responses.pluck(:test_collection_id)
      return [] if test_ids.empty?
      Collection::TestCollection
        .where(id: test_ids, test_status: 'live')
        .viewable_by(for_user, organization)
    end

    def random_next_submission_test(for_user:)
      # will be nil if none are available
      available = available_submission_tests(for_user: for_user)
      return nil if available.empty?
      # need to use inner query to combine `order` + `distinct`
      Collection::TestCollection
        .from(available, :collections)
        .order('RANDOM()')
        .first
    end

    private

    def submission_template_is_a_master_template
      return if submission_template.nil? || submission_template.master_template?
      errors.add(:submission_template, 'must be a Master Template')
    end
  end
end
