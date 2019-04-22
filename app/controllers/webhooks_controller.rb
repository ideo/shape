class WebhooksController < ApplicationController
  def filestack
    item = Item::FileItem.find_by_transcoding_uuid(params[:uuid])
    if item
      item.update(pending_transcoding_uuid: nil)
      item.filestack_file.update(
        url: params[:data][:url],
        handle: params[:data][:url].split('/').last,
        mimetype: params[:metadata][:result][:mime_type],
        size: params[:metadata][:result][:file_size],
      )
      # alert the collection that it has been updated
      CollectionUpdateBroadcaster.call(item.parent)
    end
    head :no_content
  end
end
