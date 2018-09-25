class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: %i[update]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: %i[me update destroy]
  # NOTE: these have to be in the following order
  before_action :load_and_authorize_collection_update, only: %i[update]
  before_action :load_collection_with_cards, only: %i[show update]

  before_action :check_cache, only: %i[show]
  def show
    log_organization_view_activity
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
      render jsonapi: builder.collection
    else
      render_api_errors builder.errors
    end
  end

  after_action :broadcast_collection_updates, only: %i[update]
  def update
    updated = CollectionUpdater.call(@collection, collection_params)
    if updated
      return if @cancel_sync
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  before_action :load_and_authorize_collection_destroy, only: %i[destroy]
  def destroy
    if @collection.destroy
      render json: { success: true }
    else
      render_api_errors @collection.errors
    end
  end

  before_action :load_and_authorize_test_collection_launch, only: %i[launch_test]
  def launch_test
    if @collection.launch_test!(initiated_by: current_user)
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  private

  def check_cache
    fresh_when(
      last_modified: @collection.updated_at.utc,
      etag: @collection.cache_key,
    )
  end

  def load_and_authorize_template_and_parent
    @parent_collection = Collection.find(json_api_params[:parent_id])
    @template_collection = Collection.find(json_api_params[:template_id])
    if @parent_collection.is_a?(Collection::SubmissionsCollection)
      # if adding to a SubmissionsCollection, you only need to have viewer/"participant" access
      authorize! :read, @parent_collection
      return
    end
    # we are creating a template in this collection so authorize edit_content
    authorize! :edit_content, @parent_collection
    authorize! :read, @template_collection
  end

  def load_and_authorize_collection_update
    @collection = Collection.find(params[:id])
    if collection_params[:name].present? && collection_params[:name] != @collection.name
      authorize! :edit_name, @collection
    else
      authorize! :edit_content, @collection
    end
  end

  def load_and_authorize_collection_destroy
    @collection = Collection.find(params[:id])
    # you can only destroy a submission box that hasn't been set up yet
    unless @collection.destroyable?
      head(401)
    end
    authorize! :manage, @collection
  end

  def render_collection(include: nil)
    # include collection_cards for UI to receive any updates
    include ||= Collection.default_relationships_for_api
    render jsonapi: @collection,
           include: include,
           expose: { current_record: @collection }
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

  def load_and_authorize_test_collection_launch
    @collection = Collection.find(params[:id])
    unless @collection.is_a?(Collection::TestCollection) && @collection.draft?
      head(401)
    end
    authorize! :manage, @collection
  end

  def collection_params
    params.require(:collection).permit(
      :name,
      :tag_list,
      :submission_template_id,
      :submission_box_type,
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

  def broadcast_collection_updates
    CollectionUpdateBroadcaster.call(@collection, current_user)
  end

  def broadcast_parent_collection_updates
    CollectionUpdateBroadcaster.call(@parent_collection, current_user)
  end
end
