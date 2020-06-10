class TestAudienceStatusUpdater < SimpleService
  def initialize(test_audience:, status:)
    @test_audience = test_audience
    @status = status
  end

  def call
    return unless @status.present?

    @test_audience.update(status: @status)

    test_collection = @test_audience.test_collection

    return unless test_collection.present? &&
                  test_collection.submission_box_template_test?

    # find and update inherited audiences from parent; ie: submission template test instances
    templated_submission_test_collections = Collection
                                            .in_collection(test_collection.parent_submission_box_template.parent)
                                            .where(template_id: test_collection.id)

    return unless templated_submission_test_collections.any?

    templated_submission_test_collections.each do |test_instance|
      status = TestAudience.statuses[@status]
      # creates audience if not found
      audience = test_instance.test_audiences.find_or_create_by(audience_id: @test_audience.audience_id)
      audience.update(status: status)
    end
  end
end
