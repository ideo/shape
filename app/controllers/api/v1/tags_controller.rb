class Api::V1::TagsController < Api::V1::BaseController
  def bulk_update
    items = Item.where(id: params[:item_ids])
    collections = Collection.where(id: params[:collection_ids])

    # TODO: authorize editing of all records
    # TODO: move the update to a background job
    items.each do |item|
      item.update(tag_list: params[:tag_list])
    end

    collections.each do |collection|
      collection.update(tag_list: params[:tag_list])
    end

    head :ok
  end
end
