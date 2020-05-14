require 'rails_helper'

describe Api::V1::DatasetsController, type: :request, json: true do
  context 'with API Token', api_token: true do
    def jsonapi_headers
      headers = super
      return headers if @api_token.blank?

      headers['Authorization'] = "Bearer #{@api_token.token}"
      headers
    end

    describe 'GET #index' do
      let!(:all_datasets) { create_list(:dataset, 3, :with_cached_data) }
      let(:path) { api_v1_datasets_path }
      let(:app_datasets) { all_datasets.first(2) }
      before do
        app_datasets.each do |ds|
          ds.update(application: @api_token.application)
        end
      end

      it 'returns all datasets' do
        jsonapi_get(path)
        expect(response.status).to eq(200)
        expect(
          json_ids.map(&:to_i),
        ).to match_array(app_datasets.map(&:id))
      end

      context 'with dataset that has external_id' do
        let!(:dataset_with_external_id) do
          dataset = app_datasets.first
          dataset.add_external_id(
            'my-dataset-123',
            @api_token.application.id,
          )
          dataset
        end

        it 'returns datasets matching external_id filter' do
          jsonapi_get(path, params: { filter: { external_id: 'my-dataset-123' } })
          expect(
            json_ids.map(&:to_i),
          ).to eq([dataset_with_external_id.id])
        end
      end
    end

    describe 'POST #create' do
      let(:path) { api_v1_datasets_path }
      let(:create_params) do
        {
          data: {
            type: 'datasets',
            attributes: {
              timeframe: 'month',
              chart_type: 'area',
              identifier: 'data',
              measure: 'purpose',
              cached_data: [
                { value: 24, date: '2018-09-10' },
              ],
            },
          },
        }
      end

      it 'creates dataset' do
        expect {
          jsonapi_post(path, create_params)
        }.to change(Dataset, :count).by(1)
        expect(Dataset.last.application).to eq(@api_token.application)
      end
    end

    describe 'PUT #update' do
      let!(:dataset) { create(:dataset, :with_cached_data, application: @api_token.application) }
      let(:path) { api_v1_dataset_path(dataset) }
      let(:update_params) do
        {
          data: {
            type: 'datasets',
            id: dataset.id,
            attributes: {
              measure: 'experimentation',
            },
          },
        }
      end

      it 'updates dataset' do
        jsonapi_put(path, update_params)
        expect(dataset.reload.measure).to eq('experimentation')
      end

      describe 'with groupings' do
        let!(:group) { create(:group) }
        let(:update_params) do
          {
            data: {
              type: 'datasets',
              id: dataset.id,
              attributes: {
                groupings: [{ id: group.id, type: 'Group' }],
              },
            },
          }
        end

        it 'should update the dataset to have the Group grouping' do
          jsonapi_put(path, update_params)
          expect(json['data']['relationships']['group']['data']).to eq(
            { type: 'groups', id: group.id.to_s }.as_json,
          )
          expect(dataset.reload.group).to eq(group)
        end
      end
    end
  end

  context '/collection/:id/datasets', auth: true do
    let(:user) { @user }
    let!(:collection) { create(:collection, add_editors: [user]) }
    let!(:data_item) { create(:data_item, :report_type_record, parent_collection: collection, add_editors: [user]) }
    let(:data_items_dataset) { data_item.data_items_datasets.first }
    let(:dataset) { data_items_dataset.dataset }

    describe 'POST #select' do
      let(:path) { "/api/v1/collections/#{collection.id}/datasets/select" }

      before do
        data_items_dataset.update(selected: false)
        dataset.update(identifier: 'uid')
      end

      it 'unselects dataset with identifier' do
        expect do
          post(path, params: {
            identifier: dataset.identifier,
          }.to_json)
        end.to change { data_items_dataset.reload.selected }.from(false).to(true)
        expect(response.status).to eq(200)
      end
    end

    describe 'POST #unselect' do
      let(:path) { "/api/v1/collections/#{collection.id}/datasets/unselect" }
      before do
        data_items_dataset.update(selected: true)
        dataset.update(identifier: 'uid')
      end

      it 'selects dataset with identifier' do
        expect do
          post(path, params: {
            identifier: dataset.identifier,
          }.to_json)
        end.to change { data_items_dataset.reload.selected }.from(true).to(false)
        expect(response.status).to eq(200)
      end
    end
  end
end
