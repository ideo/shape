class Api::V1::DatasetsController < Api::V1::BaseController
  load_and_authorize_resource :collection
  load_resource

  def select_measure
    update_measure(selected: true)
    render json: { success: true }
  end

  def unselect_measure
    update_measure(selected: false)
    render json: { success: true }
  end

  private

  def update_measure(selected: true)
    collection_data_items_datasets.each do |data_items_dataset|
      data_items_dataset.update(
        selected: selected,
      )
    end
  end

  def collection_data_items_datasets
    @collection
      .data_items
      .joins(data_items_datasets: :dataset)
      .where(
        data_items_datasets: {
          datasets: { measure: json_api_params[:measure] },
        },
      )
      .map(&:data_items_datasets)
      .flatten
  end
end
