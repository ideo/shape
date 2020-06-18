class Api::V1::TestAudiencesController < Api::V1::BaseController
  deserializable_resource :test_audience, class: DeserializableTestAudience, only: %i[update]
  load_and_authorize_resource

  def update
    @test_audience.attributes = test_audience_params
    if @test_audience.save
      render_test_audience
    else
      render_api_errors @test_audience.errors
    end
  end

  def toggle_status
    updater = TestAudienceStatusUpdater.new(
      test_audience: @test_audience,
      status: json_api_params[:status],
    )

    updater.call

    @test_audience.reload
    render_test_audience
  end

  private

  def render_test_audience
    render jsonapi: @test_audience,
           include: %i[test_collection],
           class: {
             TestAudience: SerializableTestAudience,
             'Collection::TestCollection': SerializableCollection,
           }
  end

  def test_audience_params
    params.require(:test_audience).permit(
      :status,
    )
  end
end
