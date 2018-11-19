class Api::V1::TestCollectionsController < Api::V1::BaseController
  before_action :load_and_authorize_test_collection, only: %i[launch close reopen]
  before_action :load_test_collection, only: %i[show next_available]
  before_action :load_submission_box_test_collection, only: %i[next_available]

  def show
    render jsonapi: @test_collection,
           class: @test_collection.test_survey_render_class_mappings,
           include: @test_collection.test_survey_render_includes,
           expose: { survey_response_for_user: @test_collection.survey_response_for_user(current_user.id) }
  end

  def launch
    if @test_collection.launch!(initiated_by: current_user)
      render_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def close
    if @test_collection.close!
      render_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def reopen
    if @test_collection.reopen!
      render_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def next_available
    test = @submission_box.random_next_submission_test(
      for_user: current_user,
      # don't want to re-get the same test again
      omit_id: @test_collection.id,
    )
    if test.present? && test.collection_to_test.present?
      render jsonapi: test.collection_to_test
    else
      render json: nil
    end
  end

  private

  def load_test_collection
    @collection = @test_collection = Collection::TestCollection.find_by(id: params[:id])
    if @test_collection.blank?
      head(404)
      return false
    end
    true
  end

  def load_submission_box_test_collection
    @submission_box = @test_collection.parent_submission_box
    unless @submission_box.present?
      head(404)
      return false
    end
    true
  end

  def load_and_authorize_test_collection
    return unless load_test_collection
    # e.g. with "edit_content" ability of a test template instance, you can still launch the test
    authorize! :edit_content, @test_collection
  end
end
