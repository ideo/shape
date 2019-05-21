class Api::V1::DatasetsController < Api::V1::BaseController
  deserializable_resource :dataset, class: DeserializableDataset, only: %i[update]
  load_and_authorize_resource :collection
  load_resource

  def update
    @dataset.attributes = dataset_params
    if @dataset.save
      render jsonapi: @dataset
    else
      render_api_errors @dataset.errors
    end
  end

  def select
    update_measure(name: json_api_params[:name], selected: true)
    render json: { success: true }
  end

  def unselect
    update_measure(name: json_api_params[:name], selected: false)
    render json: { success: true }
  end

  private

  def update_measure(name: nil, selected: true)
    return if name.blank?
    collection_data_items_datasets(name: name).each do |data_items_dataset|
      data_items_dataset.update(
        selected: selected,
      )
    end
  end

  def collection_data_items_datasets(name:)
    DataItemsDataset
      .joins(:dataset)
      .where(
        data_item_id: @collection.data_item_ids,
        datasets: { name: name },
      )
  end

  def dataset_params
    params.require(:dataset).permit(
      :type,
      :measure,
      :timeframe,
      :data_source_id,
      :data_source_type,
      :data_source,
    )
  end
end
