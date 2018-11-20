class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: %i[create update]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource except: %i[update in_my_collection]

  def show
    log_item_activity(:viewed)
    render jsonapi: @item,
           include: [:filestack_file, :parent, :parent_collection_card, roles: %i[users groups resource]],
           expose: { current_record: @item }
  end

  def create
    if @item.save
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

  private

  def load_and_authorize_item_update
    @item = Item.find(params[:id])
    authorize! :edit_content, @item
  end

  def item_params
    params.require(:item).permit(
      :type,
      :name,
      :content,
      { text_data: {} },
      { data_settings: %i[
        d_measure
        d_filters
        d_timeframe
      ] },
      :url,
      :image,
      :archived,
      :tag_list,
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
