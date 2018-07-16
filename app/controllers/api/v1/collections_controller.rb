class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: %i[create update]
  load_and_authorize_resource :organization, only:[:create]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: %i[me update]
  before_action :check_cache, only: %i[show]
  # NOTE: these have to be in the following order
  before_action :load_and_authorize_collection_update, only: %i[update]
  before_action :load_collection_with_cards, only: %i[show update archive]

  def show
    log_organization_view_activity
    render_collection
  end

  def create
    builder = CollectionBuilder.new(params: collection_params,
                                    organization: @organization,
                                    parent_card: @collection_card,
                                    created_by: current_user)

    if builder.save
      render jsonapi: builder.collection
    else
      render_api_errors builder.errors
    end
  end

  def update
    updated = CollectionUpdater.call(@collection, collection_params)
    if updated
      return if @cancel_sync
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  def duplicate
    duplicate = @collection.duplicate!(
      for_user: current_user,
      copy_parent_card: true,
      parent: current_user.current_user_collection,
    )
    if duplicate.persisted?
      render jsonapi: duplicate, include: [:parent]
    else
      render_api_errors duplicate.errors
    end
  end

  def archive
    if @collection.archive!
      ActivityAndNotificationBuilder.call(
        actor: current_user,
        target: @collection,
        action: Activity.actions[:archived],
        subject_user_ids: @collection.editors[:users].pluck(:id),
        subject_group_ids: @collection.editors[:groups].pluck(:id),
      )
      render jsonapi: @collection.reload
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

  def load_and_authorize_collection_update
    @collection = Collection.find(params[:id])
    if collection_params[:name].present? && collection_params[:name] != @collection.name
      authorize! :edit_name, @collection
    else
      authorize! :edit_content, @collection
    end
  end

  def render_collection(include: nil)
    # include collection_cards for UI to receive any updates
    include ||= Collection.default_relationships_for_api
    render jsonapi: @collection, include: include
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
      collection_cards_attributes: %i[id order width height],
    )
  end

  def log_organization_view_activity
    # Find if already logged view for this user of this org
    organization = current_user.current_organization
    previous = Activity.where(actor: current_user, target: organization.primary_group, action: Activity.actions[:joined])
    return if previous.present?
    ActivityAndNotificationBuilder.call(
      actor: current_user,
      target: organization.primary_group,
      action: Activity.actions[:joined],
      subject_user_ids: organization.members[:users].pluck(:id) + organization.admins[:users].pluck(:id),
      subject_group_ids: organization.members[:groups].pluck(:id) + organization.admins[:groups].pluck(:id),
    )
  end
end
