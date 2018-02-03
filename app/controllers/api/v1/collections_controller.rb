class Api::V1::CollectionsController < Api::V1::BaseController
  def show
    @collection = Collection.where(id: params[:id])
                            .includes(collection_cards: [:linkable])
                            .first

    render jsonapi: @collection, include: [collection_cards: [:linkable]]
  end

  def create
    if @collection.save
      render_json @collection
    else
      render_json_errors @collection.errors.full_messages
    end
  end

  def update
    @collection.attributes = collection_params
    if @collection.save
      render_json @collection
    else
      render_json_errors @collection.errors.full_messages
    end
  end

  def destroy
    if @collection.destroy
      render_json head :ok
    else
      render_json_errors @collection.errors.full_messages
    end
  end

  private

  def collection_params
    params.require(:collection).permit(
      :name
    )
  end
end
