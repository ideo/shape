class Api::V1::DatasetsController < Api::V1::BaseController
  deserializable_resource :dataset, class: DeserializableDataset, only: %i[create update]
  load_and_authorize_resource :collection
  load_resource

  def toggle_selected
    data_items_datasets = collection_data_items_datasets
    data_items_datasets.each do |data_items_dataset|
      data_items_dataset.update(
        selected: !data_items_dataset.selected,
      )
    end
    @dataset.cached_data_items_datasets = data_items_datasets.first
    render jsonapi: @dataset
  end

  private

  def collection_data_items_datasets
    @collection
      .data_items
      .joins(:data_items_datasets)
      .where(
        data_items_datasets: { dataset_id: @dataset.id },
      )
      .includes(:data_items_datasets)
      .map(&:data_items_datasets)
      .flatten
  end
end
