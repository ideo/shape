class Api::V1::TestCollectionsController < Api::V1::BaseController
  before_action :load_and_authorize_test_collection

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

  def load_and_authorize_test_collection
    @collection = @test_collection = Collection::TestCollection.find_by(id: params[:id])
    if @test_collection.blank?
      head 404
    else
      authorize! :manage, @test_collection
    end
  end
end
