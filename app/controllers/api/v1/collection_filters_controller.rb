class Api::V1::CollectionFiltersController < Api::V1::BaseController
  deserializable_resource :comment, class: DeserializableCollectionFilter, only: %i[update]
  load_and_authorize_resource :collection, only: %i[create destroy]
  load_resource :collection_filter, except: [:create]
  before_action :load_user_collection_filter, only: %i[select unselect]

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

  def destroy
    if @collection_filter.destroy
      render_collection
    else
      render_api_errors @collection_filter.errors
    end
  end

  def select
    if @user_collection_filter.update(selected: true)
      render jsonapi: @collection_filter,
             expose: { current_user: current_user }
    else
      render_api_errors @user_collection_filter.errors
    end
  end

  def unselect
    if @user_collection_filter.update(selected: false)
      render jsonapi: @collection_filter,
             expose: { current_user: current_user }
    else
      render_api_errors @user_collection_filter.errors
    end
  end

  private

  def load_user_collection_filter
    @user_collection_filter = @collection_filter
      .user_collection_filters
      .find_or_create_by(
        user_id: current_user.id,
        collection_filter_id: @collection_filter.id,
      )
    if !@user_collection_filter
      render_api_errors @user_collection_filter.errors
    end
  end
end
