class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: %i[create update]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource except: %i[update in_my_collection]

  before_action :load_and_filter_index, only: %i[index]
  def index
    render jsonapi: @items, include: params[:include]
  end

  def show
    log_item_activity(:viewed)
    render jsonapi: @item,
           include: [:filestack_file, :parent, :parent_collection_card, roles: %i[users groups resource]],
           expose: { current_record: @item }
  end

  def create
    if @item.save
      # how do we also include the legend created afterward also?
      render jsonapi: @item, include: [roles: %i[users groups resource]], expose: { current_record: @item }
    else
      render_api_errors @item.errors
    end
  end

  before_action :load_and_authorize_item_update, only: %i[update]
  def update
    @item.attributes = item_params
    if @item.save
      log_item_activity(:edited)
      CollectionUpdateBroadcaster.call(@item.parent, current_user)
      # cancel_sync means we don't want to render the item JSON
      return if @cancel_sync
      if @item.is_a?(Item::TextItem)
        @item.stopped_editing(current_user)
      end
      render jsonapi: @item, expose: { current_record: @item }
    else
      render_api_errors @item.errors
    end
  end

  def duplicate
    duplicate = @item.duplicate!(
      for_user: current_user,
      copy_parent_card: true,
      parent: current_user.current_user_collection,
    )
    if duplicate.persisted?
      render jsonapi: duplicate, include: [:parent], expose: { current_record: @item }
    else
      render_api_errors duplicate.errors
    end
  end

  def archive
    if @item.archive!
      CollectionUpdateBroadcaster.call(@item.parent, current_user)
      render jsonapi: @item.reload
    else
      render_api_errors @item.errors
    end
  end

  load_resource only: %i[in_my_collection]
  def in_my_collection
    render json: current_user.in_my_collection?(@item)
  end

  # similar method exists in collections_controller
  def restore_permissions
    Roles::MergeToChild.call(parent: @item.parent, child: @item)
    render jsonapi: @item.reload
    # no error case needed... ?
  end

  private

  def load_and_authorize_item_update
    @item = Item.find(params[:id])
    authorize! :edit_content, @item
  end

  def item_params
    params.require(:item).permit(
      :type,
      :name,
      :external_id,
      :content,
      { data_content: {} },
      { data_settings: [
        :d_measure,
        :d_timeframe,
        selected_measures: [],
        d_filters: %i[type target],
      ] },
      :url,
      :image,
      :archived,
      :tag_list,
      :thumbnail_url,
      :legend_item_id,
      filestack_file_attributes: Item.filestack_file_attributes_whitelist,
    )
  end

  def log_item_activity(activity)
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: @item,
      action: activity,
      content: @item.content,
    )
  end
end
