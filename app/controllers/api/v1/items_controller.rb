class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: %i[create update highlight]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource except: %i[update highlight in_my_collection datasets csv_report]
  before_action :load_and_authorize_item_read, only: %i[highlight csv_report datasets]
  skip_before_action :check_api_authentication!, only: %i[show]

  before_action :load_and_filter_index, only: %i[index]
  def index
    render jsonapi: @items, include: params[:include]
  end

  before_action :switch_to_organization, only: :show, if: :user_signed_in?
  def show
    log_item_activity(:viewed) if log_activity?
    render jsonapi: @item,
           include: [:filestack_file, :parent, :parent_collection_card, :restorable_parent, roles: %i[users groups resource]],
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
      log_item_activity(:edited) if log_activity?
      # text item has its own broadcast already happening in #save_and_broadcast_quill_data
      unless @item.is_a? Item::TextItem
        collection_broadcaster(@item.parent).card_updated(
          @item.parent_collection_card,
        )
      end
      if @cancel_sync
        # cancel_sync means we don't want to render the item JSON
        head :no_content
        return
      end

      render jsonapi: @item, expose: { current_record: @item }
    else
      render_api_errors @item.errors
    end
  end

  # this is a different endpoint because it only requires read permissions
  def highlight
    @item.attributes = item_params
    if TextItemHighlighter.call(item: @item, user: current_user)
      log_item_activity(:edited) if log_activity?
      # text item has its own broadcast already happening in #save_and_broadcast_quill_data
      if @cancel_sync
        # cancel_sync means we don't want to render the item JSON
        head :no_content
        return
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
      collection_broadcaster(@item.parent).cards_archived(
        [@item.parent_collection_card.id],
      )
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
    RestorePermission.call(
      object: @item,
      restored_by: current_user,
    )
    render jsonapi: @item.reload
  end

  def datasets
    render jsonapi: @item.selected_datasets,
           include: Dataset.default_includes_for_api
  end

  def csv_report
    csv_data = @item.csv_data
    send_data csv_data, filename: @item.csv_filename
  end

  private

  def load_and_authorize_item_update
    @item = Item.find(params[:id])
    authorize! :edit_content, @item
  end

  def load_and_authorize_item_read
    @item = Item.find(params[:id])
    authorize! :read, @item
  end

  def item_params
    params.require(:item).permit(
      [
        :type,
        :name,
        :external_id,
        :content,
        { quill_data: {} },
        :url,
        :image,
        :archived,
        :tag_list,
        :thumbnail_url,
        :legend_item_id,
        :legend_search_source,
        :style,
        :subtitle_hidden,
        filestack_file_attributes: Item.filestack_file_attributes_whitelist,
      ].concat(Item.globalize_attribute_names),
    )
  end

  def item_content_params
    params.require(:item).permit([
      :content,
      { quill_data: {} },
    ])
  end

  def log_item_activity(activity)
    return if activity == :viewed && params[:page_view].blank?

    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: @item,
      action: activity,
      content: @item.content,
      async: true,
    )
  end

  def switch_to_organization
    return if @item.common_viewable?

    current_user.switch_to_organization(@item.organization)
  end
end
