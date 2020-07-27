class Api::V1::TestCollectionsController < Api::V1::BaseController
  before_action :load_and_authorize_test_collection, only: %i[validate_launch launch close reopen add_comparison csv_report]
  before_action :load_test_collection, only: %i[show add_comparison remove_comparison]
  before_action :load_comparison_collection, only: %i[add_comparison remove_comparison]

  def show
    render jsonapi: @test_collection,
           class: @test_collection.test_survey_render_class_mappings,
           include: @test_collection.test_survey_render_includes,
           expose: { survey_response_for_user: @test_collection.survey_response_for_user(current_user.id) }
  end

  def validate_launch
    if @test_collection.valid_and_launchable?
      render json: :ok
    else
      render_api_errors @test_collection.errors
    end
  end

  def launch
    success = @test_collection.launch!(
      initiated_by: current_user,
      test_audience_params: json_api_params[:audiences],
    )
    if success
      render_test_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def close
    if @test_collection.close!
      render_test_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def reopen
    if @test_collection.reopen!
      render_test_collection
    else
      render_api_errors @test_collection.errors
    end
  end

  def add_comparison
    test_comparison = TestComparison.new(
      collection: @test_collection,
      comparison_collection: @comparison_collection,
    )
    if test_comparison.add
      render_test_collection
    else
      render json: { errors: test_comparison.errors }, status: :unprocessable_entity
    end
  end

  def remove_comparison
    test_comparison = TestComparison.new(
      collection: @test_collection,
      comparison_collection: @comparison_collection,
    )
    if test_comparison.remove
      render_test_collection
    else
      render json: { errors: test_comparison.errors }, status: :unprocessable_entity
    end
  end

  def csv_report
    @report = TestCollection::ExportToCsv.call(@test_collection)
    respond_to do |format|
      format.any { send_data @report, filename: "test-#{params[:id]}-#{Date.today}.csv" }
    end
  end

  private

  def render_test_collection
    included = Collection.default_relationships_for_api
    included << :test_results_collection
    render_collection(include: included)
  end

  def load_test_collection
    @collection = @test_collection = Collection::TestCollection.find_by(id: params[:id])
    if @test_collection.blank?
      head(404)
      return false
    end
    true
  end

  def load_comparison_collection
    # TODO: get the comparison collection id param the correct way
    @comparison_collection = Collection.find_by(
      id: json_api_params[:data][:comparison_collection_id],
    )
    if @comparison_collection.blank?
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
