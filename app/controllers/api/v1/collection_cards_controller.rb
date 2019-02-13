class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update replace]
  load_and_authorize_resource except: %i[move replace]
  before_action :load_and_authorize_parent_collection, only: %i[create replace]
  before_action :load_and_authorize_parent_collection_for_update, only: %i[update]
  after_action :broadcast_collection_create_updates, only: %i[create update]

  before_action :load_and_authorize_parent_collection_for_index, only: %i[index]
  before_action :check_cache, only: %i[index]
  before_action :load_collection_cards, only: %i[index]
  def index
    params[:page] ||= 1
    params[:card_order] ||= @collection.default_card_order
    render jsonapi: @collection_cards,
           include: [
             :parent,
             record: [:filestack_file],
           ],
           expose: {
             card_order: params[:card_order],
             current_record: @collection,
             parent: @collection,
             inside_a_submission: @collection.submission? || @collection.inside_a_submission?,
             inside_hidden_submission_box: @collection.hide_submissions || @collection.inside_hidden_submission_box?,
           }
  end

  def create
    card_params = collection_card_params
    type = card_params.delete(:type) || 'primary'
    # CollectionCardBuilder type expects 'primary' or 'link'
    type = 'link' if type == 'CollectionCard::Link'
    builder = CollectionCardBuilder.new(params: card_params,
                                        type: type,
                                        parent_collection: @collection,
                                        user: current_user)

    if builder.create
      card = builder.collection_card
      # reload the user's roles
      current_user.reload.reset_cached_roles!
      card.reload
      create_notification(card, :created)
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
      create_notification(@collection_card, :edited)
      render jsonapi: @collection_card.reload
    else
      render_api_errors @collection_card.errors
    end
  end

  before_action :load_and_authorize_cards, only: %i[archive unarchive]
  after_action :broadcast_collection_archive_updates, only: %i[archive unarchive]
  def archive
    @collection_cards.archive_all!(user_id: current_user.id)
    render json: { archived: true }
  end

  def unarchive
    @collection = Collection.find(json_api_params[:collection_snapshot][:id])
    @collection.unarchive_cards!(@collection_cards, collection_snapshot_params)
    render jsonapi: @collection.reload
  end

  before_action :load_and_authorize_replacing_card, only: %i[replace]
  after_action :broadcast_replacing_updates, only: %i[replace]
  def replace
    builder = CollectionCardReplacer.new(replacing_card: @replacing_card,
                                         params: collection_card_params)
    if builder.replace
      card = builder.replacing_card
      create_notification(card, :replaced)
      render jsonapi: card.reload,
             include: [:parent, record: [:filestack_file]],
             expose: { current_record: card.record }
    else
      render_api_errors builder.errors
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
             meta: { moving_cards: mover.moving_cards.pluck(:id).map(&:to_s) },
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
    new_cards = CollectionCardDuplicator.call(
      to_collection: @to_collection,
      cards: @cards,
      placement: placement,
      for_user: current_user,
    )
    new_cards.each do |card|
      create_notification(card, :duplicated)
    end
    # NOTE: for some odd reason the json api refuses to render the newly created cards here,
    # so we end up re-fetching the to_collection later in the front-end
    render jsonapi: @to_collection.reload,
           include: Collection.default_relationships_for_api,
           meta: { new_cards: new_cards.pluck(:id).map(&:to_s) },
           expose: { current_record: @to_collection }
  end

  private

  def check_cache
    fresh_when(
      last_modified: @collection.updated_at.utc,
      etag: "#{@collection.cache_key(params[:card_order])}/cards/#{params[:page]}",
    )
  end

  def load_and_authorize_parent_collection_for_index
    @collection = Collection.find(params[:collection_id])
    authorize! :read, @collection
  end

  def load_collection_cards
    # ensure per_page is between 50 and 200
    per_page = [params[:per_page].to_i, CollectionCard::DEFAULT_PER_PAGE].max
    per_page = [per_page, 200].min

    @collection_cards = @collection.collection_cards_viewable_by(
      current_user,
      card_order: params[:card_order],
      page: params[:page] || 1,
      per_page: per_page,
      hidden: params[:hidden].present?,
    )
  end

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
    @errors = []
    @cards.each do |card|
      collection = card.collection
      next unless collection.present?
      if @to_collection.within_collection_or_self?(collection)
        @errors << 'You can\'t duplicate a collection inside of itself.'
        break
      end
      if @to_collection.inside_a_master_template? && collection.any_template_instance_children?
        @errors << 'You can\'t duplicate an instance of a template inside a master template.'
        break
      end
    end
    if @errors.present?
      render json: { errors: @errors }, status: :bad_request
      return
    end
    true
  end

  def create_notification(card, action)
    # Only notify for archiving of collections (and not link cards)
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
      :is_cover,
      :filter,
    )
  end

  def collection_snapshot_params
    json_api_params[:collection_snapshot].require(:attributes).permit(
      collection_cards_attributes: %i[id order width height],
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
      :is_cover,
      :filter,
      :hidden,
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
        :report_type,
        text_data: {},
        filestack_file_attributes: [
          :url,
          :handle,
          :filename,
          :size,
          :mimetype,
          docinfo: {},
        ],
        data_settings: %i[
          d_measure
          d_timeframe
        ],
      ],
    )
  end
end
