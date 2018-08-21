class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update replace]
  load_and_authorize_resource except: %i[move replace]
  before_action :load_and_authorize_parent_collection, only: %i[create replace]

  load_and_authorize_resource :collection, only: %i[index]
  def index
    render jsonapi: @collection.collection_cards
  end

  def create
    card_params = collection_card_params
    type = card_params.delete(:type) || 'primary'
    # CollectionCardBuilder type expects 'primary' or 'link'
    type = 'link' if type == 'CollectionCard::Link'
    builder = CollectionCardBuilder.new(params: card_params,
                                        type: type,
                                        parent_collection: @collection,
                                        user: current_user,
                                        replacing_card: @replacing_card)

    if builder.create
      @collection.edited(current_user)
      # reload the user's roles
      current_user.reload.reset_cached_roles!
      if @replacing_card.present?
        create_notification(builder.collection_card, :replaced)
      else
        create_notification(builder.collection_card, :created)
      end
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

  before_action :load_and_authorize_cards, only: %i[archive]
  def archive
    CollectionCardArchiveWorker.perform_async(
      @collection_cards.pluck(:id),
      current_user.id,
    )
    @collection_cards.first.parent.edited(current_user)
    render json: { archived: true }
  end

  before_action :load_and_authorize_replacing_card, only: %i[replace]
  def replace
    if @replacing_card.archive!
      create
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
      @from_collection.edited(current_user)
      @to_collection.edited(current_user)
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
    should_update_cover = false
    # reverse cards for 'beginning' since they get duplicated one by one to the front
    @cards = @cards.reverse if placement == 'beginning'
    @cards.each do |card|
      dup = card.duplicate!(
        for_user: current_user,
        parent: @to_collection,
        placement: placement,
        duplicate_linked_records: true,
      )
      should_update_cover ||= dup.should_update_parent_collection_cover?
    end
    @to_collection.cache_cover! if should_update_cover
    # NOTE: for some odd reason the json api refuses to render the newly created cards here,
    # so we end up re-fetching the to_collection later in the front-end
    render jsonapi: @to_collection.reload, include: Collection.default_relationships_for_api
  end

  private

  def load_and_authorize_parent_collection
    @collection = Collection.find(collection_card_params[:parent_id])
    authorize! :edit_content, @collection
  end

  def load_and_authorize_moving_collections
    @from_collection = Collection.find(json_api_params[:from_id])
    @cards = CollectionCard.where(id: json_api_params[:collection_card_ids])
    @to_collection = Collection.find(json_api_params[:to_id])
    authorize! :edit_content, @from_collection
    authorize! :edit_content, @to_collection
  end

  # almost the same as above but needs to authorize read access for each card's record
  def load_and_authorize_linking_collections
    @from_collection = Collection.find(json_api_params[:from_id])
    @cards = CollectionCard.where(id: json_api_params[:collection_card_ids])
    @cards.each do |card|
      authorize! :read, card.record
    end
    @to_collection = Collection.find(json_api_params[:to_id])
    authorize! :edit_content, @to_collection
  end

  def load_and_authorize_replacing_card
    @replacing_card = CollectionCard.find(params[:id])
    authorize! :edit_content, @replacing_card.record
  end

  def load_and_authorize_cards
    @collection_cards = CollectionCard.where(id: json_api_params[:card_ids])
    @collection_cards.each do |cc|
      authorize! :edit, cc
    end
  end

  def create_notification(card, action)
    # only notify for archiving of collections (and not link cards)
    return if card.link?
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: card.record,
      action: action,
      subject_user_ids: card.record.editors[:users].pluck(:id),
      subject_group_ids: card.record.editors[:groups].pluck(:id),
    )
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
      :type,
      collection_attributes: %i[id name],
      item_attributes: [
        :id,
        :type,
        :name,
        :content,
        :url,
        :thumbnail_url,
        :icon_url,
        :image,
        :archived,
        text_data: {},
        filestack_file_attributes: [
          :url,
          :handle,
          :filename,
          :size,
          :mimetype,
          docinfo: {},
        ],
      ],
    )
  end
end
