class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: [:create, :update]
  load_and_authorize_resource :organization, only: [:index, :create]
  load_and_authorize_resource :collection_card, only: [:create]
  load_and_authorize_resource

  def index
    render jsonapi: current_organization.collections.root.order(name: :asc)
  end

  def show
    @collection = Collection.where(id: params[:id])
                            .includes(collection_cards: [:item, :collection])
                            .first

    render jsonapi: @collection, include: [collection_cards: [:item, :collection]]
  end

  def create
    builder = CollectionBuilder.new(params: collection_params,
                                    organization: @organization,
                                    collection_card: @collection_card)

    if builder.save
      render jsonapi: builder.collection
    else
      render jsonapi_errors: builder.errors
    end
  end

  def update
    @collection.attributes = collection_params
    if @collection.save
      render jsonapi: @collection
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
