class Api::V1::TestCollectionsController < Api::V1::BaseController
  before_action :load_and_authorize_test_collection, only: %i[launch close reopen]
  before_action :load_test_collection, only: %i[show]

  def show
    render jsonapi: @test_collection,
           class: @test_collection.test_survey_render_class,
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

  private

  def load_test_collection
    @collection = @test_collection = Collection::TestCollection.find_by(id: params[:id])
    if @test_collection.blank?
      head 404
      return false
    else
      return true
    end
  end

  def load_and_authorize_test_collection
    return unless load_test_collection
    authorize! :manage, @test_collection
  end
end
