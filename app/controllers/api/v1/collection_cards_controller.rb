class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update]
  load_and_authorize_resource :collection, only: %i[index]
  load_and_authorize_resource except: %i[move]
  before_action :load_and_authorize_parent_collection, only: %i[create]
  before_action :load_and_authorize_moving_collections, only: %i[move]

  def index
    render jsonapi: @collection.collection_cards
  end

  def show
    render jsonapi: @collection_card
  end

  def create
    builder = CollectionCardBuilder.new(params: collection_card_params,
                                        collection: @collection,
                                        user: current_user)
    if builder.create
      render jsonapi: builder.collection_card, include: [:parent, record: [:filestack_file]]
    else
      render_api_errors builder.errors
    end
  end

  def update
    @collection_card.attributes = collection_card_params
    if @collection_card.save
      render jsonapi: @collection_card
    else
      render_api_errors @collection_card.errors
    end
  end

  def archive
    if @collection_card.archive!
      @collection_card.reload
      render jsonapi: @collection_card, include: [:parent, record: [:filestack_file]]
    else
      render_api_errors @collection_card.errors
    end
  end

  def duplicate
    duplicate = @collection_card.duplicate!(for_user: current_user, update_order: true)
    if duplicate.persisted?
      render jsonapi: duplicate, include: [:parent, record: [:filestack_file]]
    else
      render_api_errors duplicate.errors
    end
  end

  def move
    mover = CardMover.new(
      from_collection: @from_collection,
      to_collection: @to_collection,
      card_ids: json_api_params[:collection_card_ids],
      placement: json_api_params[:placement],
    )
    if mover.call
      render jsonapi: mover.to_collection
    else
      render_api_errors mover.errors
    end
  end

  private

  def load_and_authorize_parent_collection
    @collection = Collection.find(collection_card_params[:parent_id])
    authorize! :manage, @collection
  end

  def load_and_authorize_moving_collections
    @from_collection = Collection.find(json_api_params[:from_id])
    @to_collection = Collection.find(json_api_params[:to_id])
    authorize! :manage, @from_collection
    authorize! :manage, @to_collection
  end

  def collection_card_params
    params.require(:collection_card).permit(
      :order,
      :width,
      :height,
      :reference,
      :parent_id,
      :collection_id,
      :item_id,
      collection_attributes: %i[id name],
      item_attributes: [
        :id,
        :type,
        :name,
        :content,
        { text_data: {} },
        :url,
        :thumbnail_url,
        :image,
        :archived,
        filestack_file_attributes: %i[
          url
          handle
          filename
          size
          mimetype
        ],
      ],
    )
  end
end
