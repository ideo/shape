class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: %i[create update]
  load_and_authorize_resource :organization, only: [:create]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: %i[me]
  before_action :load_collection_with_cards, only: %i[show update archive]

  def show
    render_collection
  end

  # NOTE: Not currently used?
  def me
    # Gets the user collection for this user/org combo
    @collection = current_user.current_user_collection
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
      ActivityAndNotificationBuilder.new(
        actor: current_user,
        target: @collection,
        action: Activity.actions[:archived],
        subject_users: @collection.editors[:users],
        subject_groups: @collection.editors[:groups],
      ).call
      render jsonapi: @collection.reload
    else
      render_api_errors @collection.errors
    end
  end

  private

  def render_collection(include: nil)
    # include collection_cards for UI to receive any updates
    include ||= Collection.default_relationships_for_api
    render jsonapi: @collection, include: include
  end

  def load_collection_with_cards
    # item/collection will turn into "record" when serialized
    @collection = Rails.cache.fetch(@collection.cache_key) do
      Collection.where(id: params[:id])
                .includes(Collection.default_relationships_for_cache_query)
                .first
    end
  end

  def collection_params
    params.require(:collection).permit(
      :name,
      :tag_list,
      collection_cards_attributes: %i[id order width height],
    )
  end
end
