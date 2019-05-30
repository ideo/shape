class Api::V1::TestAudiencesController < Api::V1::BaseController
  deserializable_resource :test_audience, class: DeserializableTestAudience, only: %i[create update]
  before_action :load_and_authorize_test_collection_update, only: %i[create update]
  load_resource

  def create
    if @test_audience.save
      render_test_audience
    else
      render_api_errors @test_audience.errors
    end
  end

  def destroy
    if @test_audience.destroy
      render_test_audience
    else
      render_api_errors @test_audience.errors
    end
  end

  def update
    @test_audience.attributes = test_audience_params
    if @test_audience.save
      render_test_audience
    else
      render_api_errors @test_audience.errors
    end
  end

  private

  def render_test_audience
    render jsonapi: @test_audience,
           include: [:audience, test_collection: [:test_audiences]],
           class: {
             Audience: SerializableAudience,
             TestAudience: SerializableTestAudience,
             'Collection::TestCollection': SerializableCollection,
           }
  end

  def load_and_authorize_test_collection_update
    @test_collection = Collection.find(test_audience_params[:test_collection_id])
    authorize! :edit, @test_collection
  end

  def test_audience_params
    params.require(:test_audience).permit(
      :sample_size,
      :audience_id,
      :test_collection_id,
    )
  end
end
