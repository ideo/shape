class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, only: [:create, :update]
  load_and_authorize_resource :collection, only: [:index, :create]
  load_and_authorize_resource

  def index
    render jsonapi: @collection.collection_cards
  end

  def show
    render jsonapi: @collection_card
  end

  def create
    @collection_card = @collection.collection_cards
                                  .build(collection_card_params)
    if @collection_card.save
      render jsonapi: @collection_card
    else
      render jsonapi_errors: @collection_card.errors.full_messages
    end
  end

  def update
    @collection_card.attributes = collection_card_params
    if @collection_card.save
      render jsonapi: @collection_card
    else
      render jsonapi_errors: @collection_card.errors.full_messages
    end
  end

  private

  def collection_card_params
    params.require(:collection_card).permit(
      :order,
      :width,
      :height,
      :reference,
      :parent_id,
      :collection_id,
      :item_id
    )
  end
end
