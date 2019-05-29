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
    update_measure(name: json_api_params[:identifier], selected: true)
    render json: { success: true }
  end

  def unselect
    update_measure(name: json_api_params[:identifier], selected: false)
    render json: { success: true }
  end

  private

  def update_measure(identifier: nil, selected: true)
    return if identifier.blank?
    collection_data_items_datasets(identifier: identifier).each do |data_items_dataset|
      data_items_dataset.update(
        selected: selected,
      )
    end
  end

  def collection_data_items_datasets(identifier:)
    DataItemsDataset
      .joins(:dataset)
      .where(
        data_item_id: collection_data_item_ids,
        datasets: { identifier: identifier },
      )
  end

  # All direct data items, plus any that are cover items for this collection
  def collection_data_item_ids
    arel_data_item_type = Item.arel_table[:type].eq('Item::DataItem')

    visible_data_item_ids = @collection
      .primary_collection_cards
      .visible
      .joins(:item)
      .where(arel_data_item_type)
      .pluck(Item.arel_table[:id])

    collection_cover_data_item_ids = @collection
      .collections
      .joins(:collection_cover_items)
      .where(arel_data_item_type)
      .pluck(Item.arel_table[:id])

    (visible_data_item_ids + collection_cover_data_item_ids).uniq
  end

  def dataset_params
    params.require(:dataset).permit(
      :type,
      :measure,
      :timeframe,
      :identifier,
      :data_source_id,
      :data_source_type,
      :data_source,
    )
  end
end
