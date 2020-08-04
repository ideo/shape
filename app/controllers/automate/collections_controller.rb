class Automate::CollectionsController < ActionController::Base
  include ApplicationHelper
  include CollectionCardBuilderHelpers

  def create_challenge
    # Create collection with challenge type
    logger.info '-- Creating challenge'
    challenge_collection_card = create_card(
      params: {
        collection_attributes: {
          collection_type: :challenge,
          name: 'Automated Challenge',
        },
      },
      parent_collection: current_user.current_user_collection,
      created_by: current_user,
    )
    # Set challenge topic
    challenge_collection = challenge_collection_card.collection
    challenge_collection.topic_list = %w[main automated]
    challenge_collection.save

    # Setup challenge groups
    setup = CollectionChallengeSetup.new(collection: challenge_collection, current_user: current_user)
    setup.call

    template_card = create_template_with_test(
      collection: current_user.current_user_collection,
      current_user: current_user,
    )

    submission_box = create_submission_box(
      collection: challenge_collection,
      template_card: template_card,
      user: current_user,
    )
    submission_box.update(
      submission_attrs: {
        launchable_test_id: template_card.collection.submission_attrs['launchable_test_id'],
      },
    )
    submissions_collection = submission_box.submissions_collection
    create_submission(
      submissions_collection: submissions_collection,
      template: template_card.collection,
      user: current_user,
    )

    # Add people to the reviewers group
    logger.info '-- Adding users to reviewers group'
    challenge_reviewer_group = challenge_collection.challenge_reviewer_group
    User.first(10).each do |user|
      user.add_role(Role::MEMBER, challenge_reviewer_group)
    end
    # Add reviewers to submissions

    # Redirect to the current user collection where challenge was created
    # redirect_to root_path
    redirect_to frontend_url_for(challenge_collection).to_s
  end

  private

  def create_template_with_test(collection:, current_user:)
    # Create the template for submission box with a test
    template_card = create_card(
      params: {
        collection_attributes: {
          name: 'Challenge Template',
          master_template: true,
        },
      },
      parent_collection: collection,
      created_by: current_user,
    )
    create_card(
      params: {
        item_attributes: {
          type: 'Item::TextItem',
          content: 'Add your response',
        },
      },
      parent_collection: template_card.collection,
      created_by: current_user,
    )
    # # Create test collection in there
    template_test_card = create_card(
      params: {
        collection_attributes: {
          name: 'Challenge test',
          type: 'Collection::TestCollection',
        },
      },
      parent_collection: template_card.collection,
      created_by: current_user,
    )
    template_card.collection.update(
      submission_attrs: {
        launchable_test_id: template_test_card.collection.id,
        template: true,
      },
    )
    template_collection = template_card.collection

    # Create phases in template
    3.times do |idx|
      num = idx + 1
      logger.info "-- Creating submission for Phase #{num}"
      phase_card = create_card(
        params: {
          collection_attributes: {
            collection_type: :phase,
            icon: 'phase',
            name: "Phase #{idx}",
          },
        },
        parent_collection: template_collection,
        created_by: current_user,
      )
    end

    template_card
  end

  def create_submission_box(collection:, template_card:, user:)
    # Create submission box
    # Set the submission box template to a the previously created template
    submission_box_card = create_card(
      params: {
        collection_attributes: {
          name: "#{collection.name} Submissions",
          type: 'Collection::SubmissionBox',
        },
      },
      parent_collection: collection,
      created_by: user,
    )
    submission_box = submission_box_card.collection
    SubmissionBoxTemplateSetter.new(
      submission_box: submission_box,
      template_card: template_card,
      submission_box_type: :template,
      user: current_user,
    ).call
    submission_box.submission_template.update(
      submission_attrs: {
        launchable_test_id: template_card.collection.submission_attrs['launchable_test_id'],
      },
    )
    submission_box.reload
  end

  def create_submission(submissions_collection:, template:, user:)
    # Create a submission or two
    submission = CollectionTemplateBuilder.new(
      parent: submissions_collection,
      template: template,
      created_by: user,
    ).call
    submission_test = Collection::TestCollection.find(
      submission.submission_attrs['launchable_test_id'],
    )
    submission_test.launch!
  end
end
