class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: [:create, :update]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource

  def show
    render jsonapi: @item, include: %i[roles filestack_file]
  end

  def create
    if @item.save
      render jsonapi: @item
    else
      render_api_errors @item.errors
    end
  end

  def update
    @item.attributes = item_params
    if @item.save
      render jsonapi: @item
    else
      render_api_errors @item.errors
    end
  end

  def duplicate
    duplicate = @item.duplicate!(copy_parent_card: true)
    if duplicate.persisted?
      render jsonapi: duplicate, include: [:parent]
    else
      render_api_errors duplicate.errors
    end
  end

  private

  def item_params
    params.require(:item).permit(
      :type,
      :name,
      :content,
      { text_data: {} },
      :url,
      :image,
      :archived,
      filestack_file_attributes: [
        :url,
        :handle,
        :filename,
        :size,
        :mimetype,
      ],
    )
  end
end
