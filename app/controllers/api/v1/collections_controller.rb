class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: %i[update]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: %i[update destroy in_my_collection]
  # NOTE: these have to be in the following order
  before_action :load_and_authorize_collection_update, only: %i[update]
  before_action :load_collection_with_cards, only: %i[show update]

  before_action :log_viewing_activities, only: %i[show]
  before_action :check_cache, only: %i[show]
  def show
    check_getting_started_shell
    render_collection
  end

  before_action :load_and_authorize_template_and_parent, only: %i[create_template]
  after_action :broadcast_parent_collection_updates, only: %i[create_template]
  def create_template
    builder = CollectionTemplateBuilder.new(
      parent: @parent_collection,
      template: @template_collection,
      placement: json_api_params[:placement],
      created_by: current_user,
    )

    if builder.call
      render jsonapi: builder.collection, expose: { current_record: builder.collection }
    else
      render_api_errors builder.errors
    end
  end

  after_action :broadcast_collection_updates, only: %i[update]
  def update
    updated = CollectionUpdater.call(@collection, collection_params)
    if updated
      log_collection_activity(:edited)
      return if @cancel_sync
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  load_and_authorize_resource only: %i[clear_collection_cover]
  def clear_collection_cover
    @collection.clear_collection_cover
    @collection.reload
    render_collection
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
    @collection.submission_attrs['hidden'] = false
    Roles::MergeToChild.call(
      parent: @collection.parent_submission_box,
      child: @collection,
    )
    if @collection.save
      render jsonapi: @collection,
             include: Collection.default_relationships_for_api
    else
      render_api_errors @collection.errors
    end
  end

  private

  def check_cache
    if @collection.archived? || @collection.organization.deactivated?
      head(404)
    end
    fresh_when(
      last_modified: @collection.updated_at.utc,
      etag: @collection.cache_key(params[:card_order]),
    )
  end

  def log_viewing_activities
    log_organization_view_activity
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
      head(400)
      return
    end
    # we are creating a template in this collection so authorize edit_content
    authorize! :edit_content, @parent_collection
    authorize! :read, @template_collection
  end

  def load_and_authorize_set_submission_box_template
    @submission_box = Collection.find(json_api_params[:box_id])
    authorize! :edit, @submission_box
    return true if json_api_params[:template_card_id].blank?
    @template_card = CollectionCard.find(json_api_params[:template_card_id])
    authorize! :read, @template_card
  end

  def load_and_authorize_collection_update
    @collection = Collection.find(params[:id])
    if collection_params[:name].present? && collection_params[:name] != @collection.name
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

  def load_and_authorize_collection_destroy
    @collection = Collection.find(params[:id])
    # you can only destroy a submission box that hasn't been set up yet
    unless @collection.destroyable?
      head(401)
    end
    authorize! :manage, @collection
  end

  def load_collection_with_cards
    @collection = Collection
                  .where(id: params[:id])
                  .includes(Collection.default_relationships_for_query)
                  .first
    current_user.precache_roles_for(
      [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
      @collection.children_and_linked_children,
    )
  end

  def collection_params
    params.require(:collection).permit(
      :name,
      :tag_list,
      :submission_template_id,
      :submission_box_type,
      :collection_to_test_id,
      :hide_submissions,
      collection_cards_attributes: %i[id order width height],
    )
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
    )
  end

  def log_collection_activity(activity)
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: @collection,
      action: activity,
    )
  end

  def broadcast_collection_updates
    CollectionUpdateBroadcaster.call(@collection, current_user)
  end

  def broadcast_parent_collection_updates
    CollectionUpdateBroadcaster.call(@parent_collection, current_user)
  end
end
