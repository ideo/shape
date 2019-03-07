require 'rails_helper'

describe WebhooksController, type: :request do
  describe 'GET #filestack' do
    let(:params) do
      {
        uuid: '123abc',
        data: {
          url: 'http://www.filestack.com/handle-xyz',
        },
        metadata: {
          result: {
            mime_type: 'video/mp4',
            file_size: 9_000,
          },
        },
      }
    end
    let(:path) { '/webhooks/filestack' }
    let(:collection) { create(:collection) }
    let!(:item) { create(:file_item, pending_transcoding_uuid: '123abc', parent_collection: collection) }

    it 'receives the filestack params and updates the pending item' do
      post(path, params: params)
      item.reload
      expect(item.pending_transcoding_uuid).to be nil
      expect(item.filestack_file.url).to eq 'http://www.filestack.com/handle-xyz'
      expect(item.filestack_file.handle).to eq 'handle-xyz'
    end

    it 'broadcasts the updates to the parent collection' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(collection)
      post(path, params: params)
    end
  end
end
