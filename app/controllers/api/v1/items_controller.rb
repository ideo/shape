class Api::V1::ItemsController < Api::V1::BaseController
  deserializable_resource :item, class: DeserializableItem, only: [:create, :update]
  load_and_authorize_resource :collection_card, only: :create
  load_and_authorize_resource

  def show
    render jsonapi: @item
  end

  def create
    if @item.save
      render jsonapi: @item
    else
      render jsonapi_errors: @item.errors.full_messages
    end
  end

  def update
    @item.attributes = item_params
    if @item.save
      render jsonapi: @item
    else
      render jsonapi_errors: @item.errors.full_messages
    end
  end

  private

  def item_params
    params.require(:item).permit(
      :type,
      :name,
      :content,
      :image,
      :archived
    )
  end
end
