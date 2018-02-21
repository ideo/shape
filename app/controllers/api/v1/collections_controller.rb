class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: [:create, :update]
  load_and_authorize_resource :organization, only: [:index, :create]
  load_and_authorize_resource :collection_card, only: [:create]
  before_action :load_collection_with_cards, only: %i[show update]
  # @collection will only be loaded if it hasn't already, but will still authorize
  load_and_authorize_resource except: [:me]

  def index
    @collections = current_organization.collections
                                       .root
                                       .not_custom_type
                                       .order(name: :asc)
    render jsonapi: @collections
  end

  def show
    render_collection
  end

  def me
    # Gets the user collection for this user/org combo
    @collection = current_user.collections
                              .user
                              .find_by_organization_id(current_organization.id)

    render_collection
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
      render_collection
    else
      render jsonapi_errors: @collection.errors.full_messages
    end
  end

  private

  def render_collection
    render jsonapi: @collection,
           include: [
             collection_cards: [
               :collection,
               item: [:filestack_file],
             ],
           ]
  end

  def load_collection_with_cards
    @collection = Collection.where(id: params[:id])
                            .includes(collection_cards: %i[item collection])
                            .first
  end

  def collection_params
    params.require(:collection).permit(
      :name,
      collection_cards_attributes: %i[id order],
    )
  end
end
