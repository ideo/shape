class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: %i[create update]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource except: %i[update]

  def show
    render jsonapi: @item, include: [:filestack_file, :parent, roles: %i[users groups resource]]
  end

  def create
    if @item.save
      render jsonapi: @item, include: [roles: %i[users groups resource]]
    else
      render_api_errors @item.errors
    end
  end

  before_action :load_and_authorize_item_update, only: %i[update]
  def update
    @item.attributes = item_params
    if @item.save
      # cancel_sync means we don't want to render the item JSON
      return if @cancel_sync
      @item.stopped_editing(current_user) if @item.is_a?(Item::TextItem)
      render jsonapi: @item
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
      render jsonapi: duplicate, include: [:parent]
    else
      render_api_errors duplicate.errors
    end
  end

  def archive
    if @item.archive!
      render jsonapi: @item.reload
    else
      render_api_errors @item.errors
    end
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
      :url,
      :image,
      :archived,
      :tag_list,
      filestack_file_attributes: Item.filestack_file_attributes_whitelist,
    )
  end
end
