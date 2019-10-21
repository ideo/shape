class Api::V1::CollectionFiltersController < Api::V1::BaseController
  deserializable_resource :comment, class: DeserializableCollectionFilter, only: %i[update]
  load_and_authorize_resource :collection, only: [:create, :destroy]

  def create
    filter_type = json_api_params[:filter_type]
    text = json_api_params[:text]
    @collection_filter = @collection.collection_filters.create(
      filter_type: filter_type,
      text: text,
    )
    if @collection_filter
      render_collection
    else
      render_api_errors @collection_filter.errors
    end
  end

  load_and_authorize_resource :user_collection_filter, only: [:update]
  def update

  end

  load_resource :collection_filter, only: [:destroy]
  def destroy
    if @collection_filter.destroy
      render_collection
    else
      render_api_errors @collection_filter.errors
    end
  end

  private

end
