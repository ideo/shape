class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :collection_card, class: DeserializableCollectionCard, only: %i[create update replace]
  load_and_authorize_resource except: %i[index move replace]
  skip_before_action :check_api_authentication!, only: %i[index]
  before_action :load_and_authorize_parent_collection, only: %i[create replace]
  before_action :load_and_authorize_parent_collection_for_update, only: %i[update]

  before_action :load_and_authorize_parent_collection_for_index, only: %i[index ids]
  before_action :check_cache, only: %i[index ids]
  before_action :load_collection_cards, only: %i[index ids]
  def index
    params[:card_order] ||= @collection.default_card_order

    render jsonapi: @collection_cards,
           include: CollectionCard.default_relationships_for_api,
           expose: {
             card_order: params[:card_order],
             current_record: @collection,
             parent: @collection,
             inside_a_submission: @collection.submission? || @collection.inside_a_submission?,
             inside_hidden_submission_box: @collection.hide_submissions || @collection.inside_hidden_submission_box?,
           }
  end

  # return all collection_card_ids for this particular collection
  def ids
    render json: @collection_card_ids.map(&:to_s)
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
      # because TextItems get created empty, we don't broadcast their creation
      broadcast_collection_create_updates unless card.record.is_a?(Item::TextItem)
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
    @collection_card.attributes = collection_card_update_params
    if @collection_card.save
      create_notification(@collection_card, :edited)
      broadcast_collection_create_updates
      if @collection_card.saved_change_to_is_cover?
        broadcast_parent_collection_updates
      end
      render jsonapi: @collection_card.reload,
             include: CollectionCard.default_relationships_for_api
    else
      render_api_errors @collection_card.errors
    end
  end

  before_action :load_and_authorize_cards, only: %i[archive unarchive unarchive_from_email add_tag remove_tag]
  after_action :broadcast_collection_archive_updates, only: %i[archive unarchive unarchive_from_email]
  def archive
    @collection_cards.archive_all!(user_id: current_user.id)
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
      head :no_content
    else
      render json: { errors: mover.errors }, status: :unprocessable_entity
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
    # notifications will get created in the worker that ends up running
    new_cards = CollectionCardDuplicator.call(
      to_collection: @to_collection,
      cards: @cards,
      placement: placement,
      for_user: current_user,
    )
    render jsonapi: @to_collection.reload,
           meta: { new_cards: new_cards.pluck(:id).map(&:to_s) },
           expose: { current_record: @to_collection }
  end

  private

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
    @collection_cards = CollectionCardFilter
                        .call(
                          collection: @collection,
                          user: current_user,
                          filters: filter_params.merge(page: @page),
                          application: current_application,
                          ids_only: ids_only,
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
      render json: { errors: @errors }, status: :unprocessable_entity
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

  def broadcast_parent_collection_updates
    parent = @collection.parent
    return unless parent.present?

    CollectionUpdateBroadcaster.call(parent, current_user)
  end

  def broadcast_collection_archive_updates
    return unless @collection_cards.first.present?

    CollectionUpdateBroadcaster.call(@collection_cards.first.parent, current_user)
  end

  def ordered_cards
    CollectionCard.ordered.where(id: json_api_params[:collection_card_ids])
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
        search_term
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
