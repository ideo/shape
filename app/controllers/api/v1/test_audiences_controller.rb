class Api::V1::TestAudiencesController < Api::V1::BaseController
  deserializable_resource :test_audience, class: DeserializableTestAudience, only: %i[update]
  load_and_authorize_resource

  def update
    @test_audience.attributes = test_audience_params
    if @test_audience.save
      @test_audience.test_collection.test_design.touch
      render_test_audience
    else
      render_api_errors @test_audience.errors
    end
  end

  private

  def render_test_audience
    render jsonapi: @test_audience,
           include: [test_collection: [:test_design]],
           class: {
             TestAudience: SerializableTestAudience,
             'Collection::TestCollection': SerializableCollection,
             'Collection::TestDesign': SerializableCollection,
           }
  end

  def test_audience_params
    params.require(:test_audience).permit(
      :status,
    )
  end
end
