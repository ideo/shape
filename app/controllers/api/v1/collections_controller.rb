class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: [:create, :update]
  load_and_authorize_resource :organization, only: [:index, :create]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource except: [:me]

  def index
    @collections = current_organization.collections
                                       .root
                                       .not_custom_type
                                       .order(name: :asc)
    render jsonapi: @collections
  end

  def show
    @collection = Collection.where(id: params[:id])
                            .includes(collection_cards: %i[item collection])
                            .first

    render jsonapi: @collection, include: [collection_cards: %i[item collection]]
  end

  def me
    # Gets the user collection for this user/org combo
    @collection = current_user.collections
                              .user
                              .find_by_organization_id(current_organization.id)

    render jsonapi: @collection, include: [collection_cards: %i[item collection]]
  end

  def create
    builder = CollectionBuilder.new(params: collection_params,
                                    organization: @organization,
                                    parent_card: @collection_card)

    if builder.save
      render jsonapi: builder.collection
    else
      render jsonapi_errors: builder.errors
    end
  end

  def update
    @collection.attributes = collection_params
    if @collection.save
      # TODO: optimize this as in the show method
      # include collection_cards for UI to receive any updates
      render jsonapi: @collection, include: [collection_cards: [:item, :collection]]
    else
      render jsonapi_errors: @collection.errors.full_messages
    end
  end

  private

  def collection_params
    params.require(:collection).permit(
      :name,
      collection_cards_attributes: %i[id order],
    )
  end
end
