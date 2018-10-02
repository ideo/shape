class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update replace]
  load_and_authorize_resource except: %i[move replace]
  before_action :load_and_authorize_parent_collection, only: %i[create replace]
  before_action :load_and_authorize_parent_collection_for_update, only: %i[update]
  after_action :broadcast_collection_create_updates, only: %i[create update]

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
      card = builder.collection_card
      # reload the user's roles
      current_user.reload.reset_cached_roles!
      if @replacing_card.present?
        create_notification(card, :replaced)
      else
        create_notification(card, :created)
      end
      render jsonapi: card,
             include: [:parent, record: [:filestack_file]],
             expose: { current_record: card.record }
    else
      render_api_errors builder.errors
    end
  end

  def destroy
    if @collection_card.destroy
      @collection_card.parent.reorder_cards!
      head :no_content
    else
      render_api_errors @collection_card.errors
    end
  end

  def update
    @collection_card.attributes = collection_card_update_params
    if @collection_card.save
      render jsonapi: @collection_card
    else
      render_api_errors @collection_card.errors
    end
  end

  before_action :load_and_authorize_cards, only: %i[archive]
  after_action :broadcast_collection_archive_updates, only: %i[archive]
  def archive
    CollectionCardArchiveWorker.perform_async(
      @collection_cards.pluck(:id),
      current_user.id,
    )
    render json: { archived: true }
  end

  before_action :load_and_authorize_replacing_card, only: %i[replace]
  after_action :broadcast_replacing_updates, only: %i[replace]
  def replace
    if @replacing_card.archive!
      create
    else
      render_api_errors @collection_card.errors
    end
  end

  before_action :load_and_authorize_moving_collections, only: %i[move]
  after_action :broadcast_moving_collection_updates, only: %i[move link]
  def move
    @card_action ||= 'move'
    mover = CardMover.new(
      from_collection: @from_collection,
      to_collection: @to_collection,
      cards: @cards,
      placement: json_api_params[:placement],
      card_action: @card_action,
    )
    if mover.call
      @cards.map do |card|
        create_notification(card,
                            Activity.map_move_action(@card_action))
      end
      # NOTE: even though this action is in CollectionCardsController, it returns the to_collection
      # so that it can be easily re-rendered on the page
      render jsonapi: @to_collection.reload,
             include: Collection.default_relationships_for_api,
             expose: { current_record: @to_collection }
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

  before_action :check_valid_duplication, only: %i[duplicate]
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
      @from_collection = Collection.find(json_api_params[:from_id])
      create_notification(card, :duplicated)
    end
    @to_collection.cache_cover! if should_update_cover
    # NOTE: for some odd reason the json api refuses to render the newly created cards here,
    # so we end up re-fetching the to_collection later in the front-end
    render jsonapi: @to_collection.reload,
           include: Collection.default_relationships_for_api,
           expose: { current_record: @to_collection }
end

  private

  def load_and_authorize_parent_collection
    @collection = Collection.find(collection_card_params[:parent_id])
    if @collection.is_a?(Collection::SubmissionsCollection)
      # if adding to a SubmissionsCollection, you only need to have viewer/"participant" access
      authorize! :read, @collection
      return
    end
    authorize! :edit_content, @collection
  end

  def load_and_authorize_parent_collection_for_update
    @collection = @collection_card.parent
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

  def check_valid_duplication
    @cards.each do |card|
      collection = card.collection
      next unless collection.present?
      if @to_collection.within_collection_or_self?(collection)
        @errors = 'You can\'t move a collection inside of itself.'
      end
    end
    @errors ? head(400) : true
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
      source: @from_collection,
      destination: @to_collection,
    )
  end

  def broadcast_replacing_updates
    return unless @replacing_card.parent.present?
    CollectionUpdateBroadcaster.call(@replacing_card.parent, current_user)
  end

  def broadcast_moving_collection_updates
    if @card_action == 'move'
      CollectionUpdateBroadcaster.call(@from_collection, current_user)
    end
    CollectionUpdateBroadcaster.call(@to_collection, current_user)
  end

  def broadcast_collection_create_updates
    CollectionUpdateBroadcaster.call(@collection, current_user)
  end

  def broadcast_collection_archive_updates
    return unless @collection_cards.first.present?
    CollectionUpdateBroadcaster.call(@collection_cards.first.parent, current_user)
  end

  def collection_card_update_params
    params.require(:collection_card).permit(
      :width,
      :height,
      :image_contain,
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
      :image_contain,
      collection_attributes: %i[
        id
        type
        name
        template_id
        master_template
      ],
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
        :question_type,
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
