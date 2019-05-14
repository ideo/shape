class Api::V1::DatasetsController < Api::V1::BaseController
  deserializable_resource :dataset, class: DeserializableDataset, only: %i[create update]
  load_and_authorize_resource

  def create
    if @dataset.save
      render jsonapi: @dataset
    else
      render_api_errors @dataset.errors
    end
  end

  def update
    if @dataset.save
      render jsonapi: @dataset
    else
      render_api_errors @dataset.errors
    end
  end
end
