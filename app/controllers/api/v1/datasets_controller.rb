class Api::V1::DatasetsController < Api::V1::BaseController
  deserializable_resource :dataset, class: DeserializableDataset, only: %i[create update]
  load_and_authorize_resource :collection
  load_resource except: :index

  def index
    @datasets = datasets_scope
    load_and_filter_index
    render jsonapi: @datasets
  end

  def show; end

  def create
    external_id = @dataset.external_id
    if current_application.present?
      @dataset.application = current_application
    elsif current_organization.present?
      @dataset.organization = current_organization
    end
    if @dataset.save
      if external_id.present? && current_application.present?
        @dataset.add_external_id(
          external_id,
          current_application.id,
        )
      end
      render jsonapi: @dataset, include: Dataset.default_includes_for_api
    else
      render_api_errors @dataset.errors
    end
  end

  def update
    @dataset.attributes = dataset_params

    if @dataset.save
      render jsonapi: @dataset, include: Dataset.default_includes_for_api
    else
      render_api_errors @dataset.errors
    end
  end

  def destroy
    if @dataset.destroy
      head :no_content
    else
      render_api_errors @dataset.errors
    end
  end

  def select
    update_measure(identifier: json_api_params[:identifier], selected: true)
    render json: { success: true }
  end

  def unselect
    update_measure(identifier: json_api_params[:identifier], selected: false)
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
    # break any collection caching
    @collection.touch
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
      :name,
      :identifier,
      :description,
      :max_domain,
      :measure,
      :timeframe,
      :identifier,
      :chart_type,
      :data_source_type,
      :data_source_id,
      :external_id,
      :anyone_can_view,
      groupings: %i[id type],
      style: {},
      tiers: [
        :value,
        :name,
        style: {},
      ],
      cached_data: %i[
        value
        date
        percentage
        column
      ],
    )
  end

  def datasets_scope
    if current_api_token.present?
      current_application.datasets
    else
      Dataset.where(
        organization_id: current_user.organization_ids,
      )
    end
  end
end
