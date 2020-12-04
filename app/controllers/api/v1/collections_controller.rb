class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: %i[update]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: %i[update destroy in_my_collection clear_collection_cover clear_background_image
                                         challenge_submission_boxes next_available_submission_test insert_row remove_row]
  skip_before_action :check_api_authentication!, only: %i[show]

  before_action :join_collection_group, only: :show, if: :join_collection_group?
  before_action :switch_to_organization, only: :show, if: :user_signed_in?
  before_action :load_and_authorize_collection_layout_update, only: %i[insert_row remove_row]
  before_action :load_collection_with_roles, only: %i[show update]
  before_action :load_and_authorize_collection_update, only: %i[update clear_collection_cover
                                                                clear_background_image collection_challenge_setup]
  before_action :load_and_authorize_parent_challenge, only: %i[challenge_submission_boxes next_available_submission_test]
  after_action :broadcast_parent_collection_card_update, only: %i[create_template clear_collection_cover]

  before_action :load_and_filter_index, only: %i[index]
  def index
    render jsonapi: @collections, include: params[:include]
  end

  before_action :log_viewing_activities, only: %i[show], if: :log_activity?
  before_action :check_cache, only: %i[show]
  def show
    check_getting_started_shell

    include = Collection.default_relationships_for_api
    if @collection.collection_type_challenge?
      include.concat Collection.default_relationships_for_challenge
    end
    render_collection(
      include: include,
    )
  end

  before_action :load_and_authorize_template_and_parent, only: %i[create_template]
  def create_template
    builder = CollectionTemplateBuilder.new(
      parent: @parent_collection,
      template: @template_collection,
      placement: json_api_params[:placement],
      created_by: current_user,
      external_id: json_api_params[:external_id],
      collection_card_params: json_api_params[:collection_card].present? ? json_api_collection_card_params : {},
      collection_params: json_api_params[:collection].present? ? json_api_collection_params : {},
    )

    if builder.call
      @collection = builder.collection
      log_template_used(template: @template_collection, instance: @collection)
      render_collection
    else
      render_api_errors builder.errors
    end
  end

  after_action :broadcast_collection_updates, only: %i[update]
  def update
    @updated = CollectionUpdater.call(
      @collection,
      collection_params,
      super_admin: current_user.super_admin?,
    )
    if @updated
      log_collection_activity(:edited) if log_activity?
      return if @cancel_sync

      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  def clear_collection_cover
    @parent_collection = @collection.parent
    @collection.clear_collection_cover
    @collection.reload
    render_collection
  end

  def clear_background_image
    @collection.clear_background_image
    @collection.reload
    render_collection
  end

  def collection_challenge_setup
    CollectionChallengeSetup.call(collection: @collection, user: current_user)
    @collection.reload
    render_collection
  end

  def background_update_template_instances
    unless @collection.master_template?
      render json: { success: false }
      return
    end

    type = json_api_params[:type]
    template_update_action = nil
    updated_card_ids = []

    case type
    when 'Item::TextItem'
      template_update_action = :update_text_content
      ids = json_api_params[:ids]
      updated_card_ids = ids.map(&:to_i)
    when 'Item::QuestionItem'
      template_update_action = :update_question_content
      ids = json_api_params[:ids]
      updated_card_ids = ids.map(&:to_i)
    else
      template_update_action = :update_all
      updated_card_ids = @collection.collection_cards.pluck(:id)
    end

    if updated_card_ids.empty?
      render json: { success: false }
      return
    end

    @collection.queue_update_template_instances(
      updated_card_ids: updated_card_ids,
      template_update_action: template_update_action,
    )
    render json: { success: true }
  end

  def background_update_live_test
    card_id = json_api_params[:collection_card_id]
    unless @collection.is_a?(Collection::TestCollection) &&
           @collection.live? &&
           card_id.present?
      render json: { success: false }
      return
    end

    @collection.queue_update_live_test(card_id)
    render json: { success: true }
  end

  before_action :load_and_authorize_collection_destroy, only: %i[destroy]
  def destroy
    if @collection.destroy
      render json: { success: true }
    else
      render_api_errors @collection.errors
    end
  end

  load_resource only: %i[in_my_collection]
  def in_my_collection
    render json: current_user.in_my_collection?(@collection)
  end

  def direct_children_tag_list
    all_tag_lists = @collection.collection_cards.map { |cc| cc.record.tags }.flatten
    all_tags = all_tag_lists.map(&:name)

    render json: all_tags
  end

  before_action :load_and_authorize_set_submission_box_template, only: %i[set_submission_box_template]
  def set_submission_box_template
    setter = SubmissionBoxTemplateSetter.new(
      submission_box: @submission_box,
      template_card: @template_card,
      submission_box_type: json_api_params[:submission_box_type],
      user: current_user,
    )
    if setter.call
      render jsonapi: @submission_box,
             include: Collection.default_relationships_for_api
    else
      render_api_errors setter.errors
    end
  end

  def submit
    if @collection.submit_submission!
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  def challenge_submission_boxes
    challenge_submission_boxes = @collection.challenge_submission_boxes.select do |collection|
      collection.can_view?(current_user)
    end
    submission_box_relationships = [submission_template: [:submission_template_test_collections,
                                                          submission_template_test_collections: [:test_audiences]]]

    render jsonapi: challenge_submission_boxes,
           include: Collection.default_relationships_for_api
                              .concat(
                                submission_box_relationships,
                              )
  end

  before_action :load_related_submission_box, only: %i[next_available_submission_test]
  def next_available_submission_test
    if @test_collection.present?
      render jsonapi: @test_collection
    else
      render json: nil
    end
  end

  def phase_sub_collections
    collections = @collection.all_child_collections
                             .active
                             .collection_type_phase
                             .order(start_date: :asc)
                             .select do |collection|
                               collection.can_view?(current_user)
                             end

    render jsonapi: collections
  end

  def challenge_phase_collections
    # This returns all phase collections that are children,
    # or descendants of a parent challenge
    collections = ChallengeRelevantPhaseCollections.call(
      collection: @collection,
      for_user: current_user,
    )

    # Only include collection data
    render jsonapi: collections
  end

  def restore_permissions
    RestorePermission.call(
      object: @collection,
      restored_by: current_user,
    )
    render_collection
    # no error case needed... ?
  end

  def insert_row
    @action = :insert_row
    manipulate_row
  end

  def remove_row
    @action = :remove_row
    manipulate_row
  end

  private

  def manipulate_row
    CollectionGrid::RowInserter.call(
      row: json_api_params[:row],
      collection: @collection,
      action: @action,
    )
    @collection.touch
    collection_broadcaster.row_updated(
      row: json_api_params[:row],
      action: @action,
    )

    head :no_content
  end

  def check_cache
    if @collection.organization.deactivated?
      head(404)
    end
    if @collection.is_a?(Collection::SubmissionsCollection)
      last_modified = @collection.submission_box.updated_at.utc
    else
      last_modified = @collection.updated_at.utc
    end
    fresh_when(
      last_modified: last_modified,
      etag: @collection.cache_key(params[:card_order], current_user.try(:id)),
    )
  end

  def log_viewing_activities
    # collections#show can be fetched in non "page view" contexts which is why we include this optional param
    return unless params[:page_view].present? && user_signed_in? && current_user.current_organization.present?

    log_organization_view_activity
    # TODO: we may want to log collection view for anonymous user
    log_collection_activity(:viewed)
  end

  def load_and_authorize_template_and_parent
    @parent_collection = Collection.find(json_api_params[:parent_id])
    @template_collection = Collection.find(json_api_params[:template_id])
    if @parent_collection.is_a?(Collection::SubmissionsCollection)
      # if adding to a SubmissionsCollection, you only need to have viewer/"participant" access
      authorize! :read, @parent_collection
      return
    end
    if @parent_collection.inside_a_master_template?
      # we don't allow creating instances inside of master templates --
      # can get too convoluted to handle nested "trickling down" of template updates
      head(:unprocessable_entity)
      return
    end
    # we are creating a template in this collection so authorize edit_content
    authorize! :edit_content, @parent_collection
    authorize! :read, @template_collection
  end

  def load_and_authorize_set_submission_box_template
    @submission_box = Collection.find(json_api_params[:box_id])
    authorize! :edit_content, @submission_box
    return true if json_api_params[:template_card_id].blank?

    @template_card = CollectionCard.find(json_api_params[:template_card_id])
    authorize! :read, @template_card
  end

  def load_and_authorize_parent_challenge
    @collection = Collection.find(params[:id])
    authorize! :read, @collection.collection_type == 'challenge' ? @collection : @collection.parent_challenge
  end

  def load_and_authorize_collection_layout_update
    @collection = Collection.find(params[:id])
    authorize! :edit_content, @collection
  end

  def load_and_authorize_collection_update
    @collection = Collection.find(params[:id])
    if params[:collection].present? && collection_params[:name].present? && collection_params[:name] != @collection.name
      authorize! :edit_name, @collection
    else
      authorize! :edit_content, @collection
    end
  end

  def check_getting_started_shell
    return unless @collection.getting_started_shell && @collection.can_edit?(current_user)

    PopulateGettingStartedShellCollection.call(@collection, for_user: current_user)
    @collection.reload
  end

  # no longer used (used to be a fallback check in collections#show)
  def check_4wfc_migration
    return if @collection.board_collection?

    CollectionGrid::BoardMigrator.call(collection: @collection, async: true)
  end

  def load_and_authorize_collection_destroy
    @collection = Collection.find(params[:id])
    # you can only destroy a submission box that hasn't been set up yet
    unless @collection.destroyable?
      head(:unauthorized)
    end
    authorize! :manage, @collection
  end

  def load_collection_with_roles
    @collection = Collection
                  .where(id: params[:id])
                  .includes(Collection.default_relationships_for_query)
                  .first
    return unless user_signed_in?

    current_user.precache_roles_for(
      [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
      resources: ([@collection] + Collection.where(id: @collection.breadcrumb)),
    )
  end

  def load_related_submission_box
    if @collection.is_a?(Collection::SubmissionBox)
      @submission_box = @collection
    else
      @submission_box = @collection.parent_submission_box
      if @submission_box.nil? && @collection.challenge_or_inside_challenge?
        # NOTE: if a challenge happens to have multiple submission boxes
        # this may not find the "best" one, since we just use most recently updated
        @submission_box = @collection
                          .challenge_submission_boxes
                          .order(updated_at: :desc)
                          .first
      end
    end

    unless @submission_box.present?
      head(404)
      return
    end

    @test_collection = @submission_box.random_next_submission_test(
      for_user: current_user,
      omit_id: @collection.test_collection? ? @collection.id : nil,
    ).first
  end

  def collection_params
    params.require(:collection).permit(permitted_collection_params)
  end

  def json_api_collection_params
    json_api_params.require(:collection).permit(permitted_collection_params)
  end

  def json_api_collection_card_params
    json_api_params.require(:collection_card).permit(
      :order,
      :row,
      :col,
      :width,
      :height,
      :is_cover,
      :hidden,
      :pinned,
      :filter,
      :font_color,
      :font_background,
    )
  end

  def permitted_collection_params
    [
      :name,
      :tag_list,
      :submission_template_id,
      :submission_box_type,
      :collection_to_test_id,
      :hide_submissions,
      :submissions_enabled,
      :anyone_can_view,
      :anyone_can_join,
      :joinable_group_id,
      :cover_type,
      :default_group_id,
      :hardcoded_subtitle,
      :subtitle_hidden,
      :test_show_media,
      :search_term,
      :collection_type,
      :start_date,
      :end_date,
      :icon,
      :font_color,
      :propagate_font_color,
      :propagate_background_image,
      :show_icon_on_cover,
      submission_attrs: {},
      user_tag_list: [],
      collection_cards_attributes: %i[id order width height row col pinned],
    ].concat(Collection.globalize_attribute_names)
  end

  def log_organization_view_activity
    # Find if already logged view for this user of this org
    organization = current_user.current_organization
    previous = Activity.where(actor: current_user, target: organization.primary_group, action: :joined)
    return if previous.present?

    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: organization.primary_group,
      action: :joined,
      async: true,
    )
  end

  def log_template_used(template:, instance:)
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: instance,
      source: template,
      action: :template_used,
      content: template.collection_type,
      async: true,
    )
    template_ids = current_user.cached_last_5_used_template_ids || []
    template_ids.prepend template.id
    template_ids = template_ids.first(5).uniq
    current_user.cached_last_5_used_template_ids = template_ids
    current_user.save
  end

  def log_collection_activity(activity)
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: @collection,
      action: activity,
      async: true,
    )
  end

  def broadcast_collection_updates
    return unless @updated

    collection_broadcaster.collection_updated
    if @collection.parent_collection_card.present?
      collection_broadcaster(@collection.parent).card_updated(
        @collection.parent_collection_card,
      )
    end
    queue_linked_updates

    card_attrs = collection_params[:collection_cards_attributes]
    return unless card_attrs.present?

    collection_broadcaster.card_attrs_updated(
      card_attrs.as_json,
    )
  end

  def broadcast_parent_collection_card_update
    collection_broadcaster(@parent_collection).card_updated(
      @collection.parent_collection_card,
    )
  end

  def queue_linked_updates
    return unless @collection.cards_linked_to_this_collection.any?

    LinkBroadcastWorker.perform_async(
      @collection.id,
      'Collection',
      current_user.id,
    )
  end

  def join_collection_group?
    user_signed_in? &&
      @collection.anyone_can_join? &&
      @collection.joinable_group.present?
  end

  def join_collection_group
    group = @collection.joinable_group
    # first join the org if you need to...
    unless @collection.organization.can_view? current_user
      # even with this pushing some functions to the background, it's still a little slow
      @collection.organization.setup_user_membership_and_collections(current_user)
    end
    # only add_role if it's not the guest group
    current_user.add_role(Role::MEMBER, group) unless group.guest?
  end
end
