require 'rails_helper'

describe Api::V1::DatasetsController, type: :request, json: true, auth: true do
  let(:user) { @user }
  let!(:collection) { create(:collection, add_editors: [user]) }
  let!(:data_item) { create(:data_item, :report_type_record, parent_collection: collection, add_editors: [user]) }
  let(:data_items_dataset) { data_item.data_items_datasets.first }
  let(:dataset) { data_items_dataset.dataset }

  describe 'POST #select_measure' do
    let(:path) { "/api/v1/collections/#{collection.id}/datasets/select_measure" }

    it 'unselects dataset with measure' do
      expect {
        post(path, params: { measure: dataset.measure }.to_json)
      }.to change { data_items_dataset.reload.selected }.from(true).to(false)
      expect(response.status).to eq(200)
    end
  end

  describe 'POST #unselect_measure' do
    let(:path) { "/api/v1/collections/#{collection.id}/datasets/unselect_measure" }
    before do
      data_items_dataset.update(selected: false)
    end

    it 'selects dataset with measure' do
      expect {
        post(path, params: { measure: dataset.measure }.to_json)
      }.to change { data_items_dataset.reload.selected }.from(false).to(true)
      expect(response.status).to eq(200)
    end
  end
end
