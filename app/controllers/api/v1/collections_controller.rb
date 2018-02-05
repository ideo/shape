class Api::V1::CollectionsController < Api::V1::BaseController
  def show
    @collection = Collection.where(id: params[:id])
                            .includes(collection_cards: [:item, :collection])
                            .first

    render jsonapi: @collection, include: [collection_cards: [:item, :collection]]
  end

  def create
    if @collection.save
      render jsonapi: @collection
    else
      render jsonapi_errors: @collection.errors.full_messages
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

  def destroy
    if @collection.destroy
      render jsonapi: @collection
    else
      render jsonapi_errors: @collection.errors.full_messages
    end
  end

  private

  def collection_params
    params.require(:collection).permit(
      :name
    )
  end
end
