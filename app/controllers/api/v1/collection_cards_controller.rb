class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update replace update_card_filter]
  load_and_authorize_resource except: %i[index move replace update_card_filter]
  skip_before_action :check_api_authentication!, only: %i[index]
  before_action :load_and_authorize_parent_collection, only: %i[create replace update_card_filter]
  before_action :load_and_authorize_parent_collection_for_update, only: %i[update]
  before_action :load_and_authorize_parent_collection_for_index, only: %i[index ids breadcrumb_records ids_in_direction]
  before_action :load_and_authorize_collection_card_update, only: %i[update_card_filter]
  before_action :check_cache, only: %i[index ids breadcrumb_records]
  before_action :load_collection_cards, only: %i[index ids breadcrumb_records]
  def index
    render_collection_cards
  end

  def show
    render jsonapi: @collection_card,
           include: CollectionCard.default_relationships_for_api
  end

  # return all collection_card_ids for this particular collection
  def ids
    render json: @collection_card_ids
  end

  def ids_in_direction
    direction = params[:direction].presence || 'bottom'
    card_id = params[:collection_card_id]
    card = CollectionCard.find(card_id)
    selected_cards = CardSelector.call(
      card: card,
      direction: direction,
      user: current_user,
    )

    render json: selected_cards.pluck(:id).map(&:to_s)
  end

  def breadcrumb_records
    card_data = @collection_cards
                .select { |card| card.record.is_a?(Collection) }
                .map do |card|
      {
        id: card.record.id,
        type: card.record.class.base_class.name.downcase.pluralize,
        collection_type: card.record.class.name,
        name: card.record.name,
        has_children: card.record.has_child_collections?,
      }
    end
    render json: card_data
  end

  def create
    card_params = collection_card_params
    # CollectionCardBuilder type expects 'primary' or 'link'
    card_type = card_params.delete(:card_type) || 'primary'

    builder = CollectionCardBuilder.new(params: card_params,
                                        type: card_type,
                                        parent_collection: @collection,
                                        user: current_user)

    if builder.create
      card = builder.collection_card
      # reload the user's roles
      current_user.reload.reset_cached_roles!
      card.reload
      create_notification(card, :created)
      broadcast_collection_create_updates(card)
      render jsonapi: card,
             include: CollectionCard.default_relationships_for_api,
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
    updated = CollectionCardUpdater.call(@collection_card, collection_card_update_params)
    if updated
      create_notification(@collection_card, :edited)
      broadcast_collection_create_updates(@collection_card)
      if @collection_card.saved_change_to_is_cover?
        broadcast_parent_collection_updates(@collection_card)
      end
      @collection_card.reload
      render_collection_card
    else
      render_api_errors @collection_card.errors
    end
  end

  def update_card_filter
    updated = CollectionCardUpdater.call(@collection_card, collection_card_update_params)
    if updated
      create_notification(@collection_card, :edited)
      broadcast_collection_create_updates
      @collection_card.reload
      render_collection_card
    else
      render_api_errors @collection_card.errors
    end
  end

  before_action :load_and_authorize_cards, only: %i[archive unarchive unarchive_from_email add_tag remove_tag]
  after_action :broadcast_collection_archive_updates, only: %i[archive unarchive unarchive_from_email]
  def archive
    CollectionCard.archive_all!(ids: @collection_cards.pluck(:id), user_id: current_user.id)
    render json: { archived: true }
  end

  def unarchive
    if json_api_params[:collection_snapshot].present?
      @collection = Collection.find(json_api_params[:collection_snapshot][:id])
    else
      @collection = Collection.find(@collection_cards.first.parent.id)
    end
    @collection.unarchive_cards!(@collection_cards, collection_snapshot_params)
    render jsonapi: @collection.reload
  end

  def unarchive_from_email
    @collection = Collection.find(@collection_cards.first.parent.id)
    if @collection_cards.any?(&:archived)
      @collection.unarchive_cards!(@collection_cards, {})
    end
    redirect_to frontend_url_for(@collection).to_s
  end

  def add_tag
    CollectionCardsAddRemoveTagWorker.perform_async(
      @collection_cards.map(&:id),
      json_api_params[:tag],
      :add,
      current_user.id,
    )
    head :no_content
  end

  def remove_tag
    CollectionCardsAddRemoveTagWorker.perform_async(
      @collection_cards.map(&:id),
      json_api_params[:tag],
      :remove,
      current_user.id,
    )
    head :no_content
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
             include: CollectionCard.default_relationships_for_api,
             expose: { current_record: card.record }
    else
      render_api_errors builder.errors
    end
  end

  before_action :load_and_authorize_moving_collections, only: %i[move]
  after_action :broadcast_moving_collection_updates, only: %i[move]
  def move
    placement = json_api_params[:placement].presence || 'beginning'
    @card_action ||= 'move'
    if @cards.count >= bulk_operation_threshold && !moving_within_collection
      return perform_bulk_operation(
        placement: placement,
        action: @card_action,
      )
    end
    mover = CardMover.new(
      from_collection: @from_collection,
      to_collection: @to_collection,
      cards: @cards,
      placement: placement,
      card_action: @card_action,
    )
    @moved_cards = mover.call
    if @moved_cards
      # we still create notifications on the original @cards
      @cards.map do |card|
        create_notification(
          card,
          Activity.map_move_action(@card_action),
        )
      end
      render_to_collection_with_cards(@moved_cards)
    else
      render json: { errors: mover.errors }, status: :unprocessable_entity
    end
  end

  before_action :load_and_authorize_linking_collections, only: %i[link duplicate]
  after_action :broadcast_linking_collection_updates, only: %i[link]
  def link
    @card_action = 'link'
    move
  end

  before_action :check_valid_duplication, only: %i[duplicate]
  def duplicate
    placement = json_api_params[:placement]
    if @cards.count >= bulk_operation_threshold
      return perform_bulk_operation(
        placement: placement,
        action: 'duplicate',
      )
    end

    # notifications will get created in the worker that ends up running
    new_cards = CollectionCardDuplicator.call(
      to_collection: @to_collection,
      cards: @cards,
      placement: placement,
      for_user: current_user,
    )
    render_to_collection_with_cards(new_cards)
  end

  def toggle_pin
    pinner = CardPinner.new(
      card: @collection_card,
      pinning: json_api_params[:pinned],
    )

    pinner.call

    render jsonapi: @collection_card.reload, include: CollectionCard.default_relationships_for_api
  end

  private

  def render_collection_cards(collection: @collection, collection_cards: @collection_cards)
    params[:card_order] ||= collection.default_card_order

    render jsonapi: collection_cards,
           include: CollectionCard.default_relationships_for_api,
           expose: {
             card_order: params[:card_order],
             current_record: collection,
             parent: collection,
             inside_a_submission: collection.submission? || collection.inside_a_submission?,
             inside_hidden_submission_box: collection.hide_submissions || collection.inside_hidden_submission_box?,
             include: params[:include],
           }
  end

  def render_to_collection_with_cards(new_cards)
    render_collection_cards(collection: @to_collection, collection_cards: new_cards)
  end

  def render_collection_card(include: nil)
    include ||= CollectionCard.default_relationships_for_api
    render jsonapi: @collection_card,
           include: include
  end

  def perform_bulk_operation(placement:, action:)
    card = BulkCardOperationProcessor.call(
      placement: placement,
      action: action,
      cards: @cards,
      to_collection: @to_collection,
      for_user: current_user,
    )

    if card
      # card is the newly created placeholder
      render jsonapi: card,
             include: CollectionCard.default_relationships_for_api,
             meta: { placeholder: true },
             expose: { current_record: card.record }
    else
      render json: { errors: 'Unable to create placeholder' }, status: :unprocessable_entity
    end
  end

  def bulk_operation_threshold
    # env var makes this more editable for tests
    ENV.fetch('BULK_OPERATION_THRESHOLD') { CollectionCard::DEFAULT_PER_PAGE }.to_i
  end

  def check_cache
    fresh_when(
      last_modified: @collection.updated_at.utc,
      etag: "#{@collection.cache_key(params[:card_order], current_user.try(:id))}/cards/#{@page}",
    )
  end

  def load_and_authorize_parent_collection_for_index
    @collection = Collection.find(
      params[:collection_id].presence || params[:filter][:collection_id],
    )
    authorize! :read, @collection
  end

  def load_collection_cards
    ids_only = params[:action] == 'ids'
    filter_params = params[:filter].present? ? params[:filter] : params
    filter_params.merge(q: params[:q]) if params[:q].present?
    select_ids = params[:select_ids].present? ? params[:select_ids].split(',') : nil
    @collection_cards = CollectionCardFilter::Base
                        .call(
                          collection: @collection,
                          user: current_user,
                          filters: filter_params.merge(page: @page),
                          application: current_application,
                          ids_only: ids_only,
                          select_ids: select_ids,
                        )
    return unless user_signed_in?

    # ids_only does not need to precache roles
    if ids_only
      @collection_card_ids = @collection_cards
      return
    end
    # precache roles because these will be referred to in the serializers (e.g. can_edit?)
    current_user.precache_roles_for(
      [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
      @collection_cards.map(&:record).compact,
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
    @cards = ordered_cards
    @to_collection = Collection.find(json_api_params[:to_id])
    prevent_moving_into_test_collection
    @cards.primary.each do |card|
      authorize! :move, card
    end
    @cards.link.each do |card|
      authorize! :read, card
    end
    authorize! :edit_content, @to_collection
    load_from_collection
  end

  # almost the same as above but needs to authorize read access for each card's record
  def load_and_authorize_linking_collections
    @cards = ordered_cards
    @cards.each do |card|
      authorize! :read, card
    end
    @to_collection = Collection.find(json_api_params[:to_id])
    prevent_moving_into_test_collection
    authorize! :edit_content, @to_collection
    load_from_collection
  end

  def load_from_collection
    if json_api_params[:from_id]
      @from_collection = Collection.find(json_api_params[:from_id])
    else
      # parent collection can be implied if from_id is not present
      # NOTE: link/duplicate actions could probably be refactored to not load @from_collection
      @from_collection = @cards.first.parent
    end
  end

  def load_and_authorize_replacing_card
    @replacing_card = CollectionCard.find(params[:id])
    authorize! :edit_content, @replacing_card.record
  end

  def load_and_authorize_collection_card_update
    @collection_card = CollectionCard.find(params[:id])
    authorize! :edit_content, @collection
  end

  def load_and_authorize_cards
    @collection_cards = CollectionCard.where(id: json_api_params[:card_ids])
    @collection_cards.each do |card|
      # - primary cards authorize edit via the record
      # - link cards authorize edit via the parent collection
      authorize! :edit, card
    end
  end

  def prevent_moving_into_test_collection
    head(:unprocessable_entity) if @to_collection.is_a?(Collection::TestCollection)
  end

  def check_valid_duplication
    prevent_moving_into_test_collection
    @errors = []
    @cards.each do |card|
      collection = card.collection
      next unless collection.present?

      if @to_collection.within_collection_or_self?(collection.id)
        @errors << 'You can\'t duplicate a collection inside of itself.'
        break
      end
      if @to_collection.inside_a_master_template? && collection.any_template_instance_children?
        @errors << 'You can\'t duplicate an instance of a template inside a master template.'
        break
      end
    end
    if @errors.present?
      render json: { errors: @errors }, status: :unprocessable_entity
      return
    end
    true
  end

  def create_notification(card, action)
    # Only notify for archiving of collections (and not link cards)
    return if card.link?

    from_id = @from_collection&.id
    to_id = @to_collection&.id
    return if action == :moved && from_id == to_id

    ActivityAndNotificationForCardWorker.perform_async(
      current_user.id,
      card.id,
      action,
      from_id,
      to_id,
    )
  end

  def broadcast_replacing_updates
    return unless @replacing_card.parent.present?

    collection_broadcaster(@replacing_card.parent).card_updated(@replacing_card)
  end

  def broadcast_moving_collection_updates
    card_ids = @cards.pluck(:id)
    unless moving_within_collection
      # treat this as if they were "archived"
      collection_broadcaster(@from_collection).cards_archived(
        card_ids,
      )
    end

    collection_broadcaster(@to_collection).cards_updated(
      card_ids,
    )
  end

  def broadcast_linking_collection_updates
    return if @moved_cards.blank?

    collection_broadcaster(@to_collection).cards_updated(
      @moved_cards.pluck(:id),
    )
  end

  def broadcast_collection_create_updates(card)
    collection_broadcaster.card_updated(card)
  end

  def broadcast_parent_collection_updates(card)
    parent = @collection.parent
    return unless parent.present?

    collection_broadcaster(parent).card_updated(card)
  end

  def broadcast_collection_archive_updates
    parent = @collection_cards.first&.parent
    return unless parent.present?

    card_ids = @collection_cards.pluck(:id)
    if params[:action] == 'archive'
      collection_broadcaster(parent).cards_archived(
        card_ids,
      )
      return
    end

    # this is for unarchive
    collection_broadcaster(parent).cards_updated(
      card_ids,
    )
  end

  def ordered_cards
    CollectionCard
      .ordered
      .not_placeholder
      .where(id: json_api_params[:collection_card_ids])
  end

  def moving_within_collection
    return true if json_api_params[:from_id].blank?

    @from_collection == @to_collection
  end

  def collection_card_update_params
    params.require(:collection_card).permit(
      :width,
      :height,
      :image_contain,
      :is_cover,
      :filter,
      :show_replace,
      :order,
      :hidden,
      :section_type,
      :font_color,
      :font_background,
    )
  end

  def collection_snapshot_params
    attrs = json_api_params[:collection_snapshot].try(:[], :attributes)
    return {} if attrs.nil?

    attrs.permit(collection_cards_attributes: %i[id order width height row col])
  end

  def collection_card_nested_attributes
    [
      collection_attributes: %i[
        id
        type
        name
        template_id
        master_template
        external_id
        cover_type
        submissions_enabled
        test_show_media
        tag_list
        search_term
        num_columns
      ].concat(Collection.globalize_attribute_names),
      item_attributes: [
        :id,
        :type,
        :name,
        :url,
        :thumbnail_url,
        :icon_url,
        :image,
        :archived,
        :question_type,
        :report_type,
        :external_id,
        :content,
        :legend_item_id,
        :legend_search_source,
        :tag_list,
        data_content: {},
        style: {},
        filestack_file_attributes: [
          :url,
          :handle,
          :filename,
          :size,
          :mimetype,
          docinfo: {},
        ],
        data_items_datasets_attributes: %i[
          order
          selected
          dataset_id
        ],
        datasets_attributes: [
          :identifier,
          :description,
          :order,
          :selected,
          :max_domain,
          :cached_data,
          :measure,
          :timeframe,
          :chart_type,
          :tiers,
          :data_source_type,
          :data_source_id,
          :anyone_can_view,
          style: {},
          cached_data: %i[
            value
            date
            percentage
            column
          ],
        ],
      ].concat(Item.globalize_attribute_names),
    ]
  end

  def collection_card_attributes
    attrs = %i[
      order
      row
      col
      width
      height
      reference
      parent_id
      collection_id
      item_id
      image_contain
      is_cover
      filter
      hidden
      show_replace
      card_type
      section_type
      font_color
      font_background
    ]
    # Allow pinning, replacing if this is an application/bot user
    attrs << :pinned if current_application.present?
    attrs << :show_replace if current_application.present?
    attrs
  end

  def collection_card_params
    params.require(:collection_card).permit(
      collection_card_attributes + collection_card_nested_attributes,
    )
  end
end
