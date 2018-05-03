class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update]
  load_and_authorize_resource except: %i[move]

  load_and_authorize_resource :collection, only: %i[index]
  def index
    render jsonapi: @collection.collection_cards
  end

  def show
    render jsonapi: @collection_card
  end

  before_action :load_and_authorize_parent_collection, only: %i[create]
  def create
    builder = CollectionCardBuilder.new(params: collection_card_params,
                                        parent_collection: @collection,
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

  before_action :load_and_authorize_moving_collections, only: %i[move]
  def move
    mover = CardMover.new(
      from_collection: @from_collection,
      to_collection: @to_collection,
      cards: @cards,
      placement: json_api_params[:placement],
      card_action: @card_action || 'move',
    )
    if mover.call
      # NOTE: even though this action is in CollectionCardsController, it returns the to_collection
      # so that it can be easily re-rendered on the page
      render jsonapi: @to_collection.reload, include: Collection.default_relationships_for_api
    else
      render json: { errors: mover.errors }, status: :bad_request
    end
  end

  # has its own route even though it's mostly the same as #move
  before_action :load_and_authorize_linking_collections, only: %i[link duplicate]
  def link
    @card_action = 'link'
    move
  end

  def duplicate
    placement = json_api_params[:placement]
    # reverse cards for 'beginning' since they get duplicated one by one to the front
    @cards = @cards.reverse if placement == 'beginning'
    @cards.each do |card|
      card.duplicate!(
        for_user: current_user,
        parent: @to_collection,
        placement: placement,
        duplicate_linked_records: true,
      )
    end
    # NOTE: for some odd reason the json api refuses to render the newly created cards here,
    # so we end up re-fetching the to_collection later in the front-end
    render jsonapi: @to_collection.reload, include: Collection.default_relationships_for_api
  end

  private

  def load_and_authorize_parent_collection
    @collection = Collection.find(collection_card_params[:parent_id])
    authorize! :manage, @collection
  end

  def load_and_authorize_moving_collections
    @from_collection = Collection.find(json_api_params[:from_id])
    @cards = @from_collection.collection_cards.where(id: json_api_params[:collection_card_ids])
    @to_collection = Collection.find(json_api_params[:to_id])
    authorize! :manage, @from_collection
    authorize! :manage, @to_collection
  end

  # almost the same as above but needs to authorize read access for each card's record
  def load_and_authorize_linking_collections
    @from_collection = Collection.find(json_api_params[:from_id])
    @cards = @from_collection.collection_cards.where(id: json_api_params[:collection_card_ids])
    @cards.each do |card|
      authorize! :read, card.record
    end
    @to_collection = Collection.find(json_api_params[:to_id])
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
